import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  return value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : null;
  };
  return {
    employeesPath: get("--employees"),
    equipmentsPath: get("--equipments"),
    allocationsPath: get("--allocations"),
    truncate: args.includes("--truncate"),
  };
}

function splitSemicolonLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ";" && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const lines = raw.split("\n");
  const headers = splitSemicolonLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const cols = splitSemicolonLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = cols[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function nullIfEmpty(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function mapEmployees(rows) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    email: r.email,
    department: r.department,
    created_at: nullIfEmpty(r.created_at),
    updated_at: nullIfEmpty(r.updated_at),
    status: nullIfEmpty(r.status) || "Ativo",
  }));
}

function mapEquipments(rows) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    classification: r.classification,
    serial_number: r.serial_number,
    purchase_value: Number(r.purchase_value || 0),
    purchase_date: r.purchase_date,
    status: r.status || "available",
    image_url: nullIfEmpty(r.image_url),
    created_at: nullIfEmpty(r.created_at),
    updated_at: nullIfEmpty(r.updated_at),
  }));
}

function mapAllocations(rows) {
  return rows.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    equipment_id: r.equipment_id,
    allocated_at: nullIfEmpty(r.allocated_at),
    returned_at: nullIfEmpty(r.returned_at),
    notes: nullIfEmpty(r.notes),
    type: r.type || "onboarding",
    term_signed: nullIfEmpty(r.term_signed) === null ? null : String(r.term_signed).toLowerCase() === "true",
    term_signed_at: nullIfEmpty(r.term_signed_at),
    created_at: nullIfEmpty(r.created_at),
    return_deadline: nullIfEmpty(r.return_deadline),
  }));
}

async function upsertInBatches(client, table, rows, chunkSize = 500) {
  if (!rows.length) {
    console.log(`${table}: 0 registros (nada para importar).`);
    return;
  }

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }

  console.log(`${table}: ${rows.length} registro(s) importado(s).`);
}

async function maybeTruncate(client, enabled) {
  if (!enabled) return;
  const { error: e1 } = await client.from("allocations").delete().not("id", "is", null);
  if (e1) throw new Error(`allocations truncate: ${e1.message}`);
  const { error: e2 } = await client.from("equipments").delete().not("id", "is", null);
  if (e2) throw new Error(`equipments truncate: ${e2.message}`);
  const { error: e3 } = await client.from("employees").delete().not("id", "is", null);
  if (e3) throw new Error(`employees truncate: ${e3.message}`);
}

async function main() {
  const args = parseArgs();
  if (!args.employeesPath || !args.equipmentsPath || !args.allocationsPath) {
    throw new Error("Uso: node scripts/import-csv-to-supabase.js --employees <file> --equipments <file> --allocations <file> [--truncate]");
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const employeesRaw = parseCsv(path.resolve(args.employeesPath));
  const equipmentsRaw = parseCsv(path.resolve(args.equipmentsPath));
  const allocationsRaw = parseCsv(path.resolve(args.allocationsPath));

  const employees = mapEmployees(employeesRaw);
  const equipments = mapEquipments(equipmentsRaw);
  const allocations = mapAllocations(allocationsRaw);

  console.log(`Lidos CSVs: employees=${employees.length}, equipments=${equipments.length}, allocations=${allocations.length}`);

  await maybeTruncate(supabase, args.truncate);
  await upsertInBatches(supabase, "employees", employees);
  await upsertInBatches(supabase, "equipments", equipments);
  await upsertInBatches(supabase, "allocations", allocations);

  const [c1, c2, c3] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("equipments").select("*", { count: "exact", head: true }),
    supabase.from("allocations").select("*", { count: "exact", head: true }),
  ]);

  if (c1.error) throw c1.error;
  if (c2.error) throw c2.error;
  if (c3.error) throw c3.error;

  console.log(`Destino: employees=${c1.count ?? 0}, equipments=${c2.count ?? 0}, allocations=${c3.count ?? 0}`);
  console.log("Importacao concluida.");
}

main().catch((err) => {
  console.error("Falha na importacao:", err.message);
  process.exit(1);
});

