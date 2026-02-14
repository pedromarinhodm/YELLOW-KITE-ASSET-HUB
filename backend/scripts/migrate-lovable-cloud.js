import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;
const TABLES = ["employees", "equipments", "allocations"];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    truncate: args.includes("--truncate"),
  };
}

async function fetchAllRows(client, table) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`[SOURCE:${table}] ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

async function maybeTruncateTarget(client, enabled) {
  if (!enabled) return;

  console.log("Limpando dados no destino (allocations -> equipments -> employees)...");

  const { error: e1 } = await client.from("allocations").delete().not("id", "is", null);
  if (e1) throw new Error(`[TARGET:allocations] ${e1.message}`);

  const { error: e2 } = await client.from("equipments").delete().not("id", "is", null);
  if (e2) throw new Error(`[TARGET:equipments] ${e2.message}`);

  const { error: e3 } = await client.from("employees").delete().not("id", "is", null);
  if (e3) throw new Error(`[TARGET:employees] ${e3.message}`);
}

async function upsertRows(client, table, rows) {
  if (!rows.length) {
    console.log(`Sem dados para ${table}.`);
    return;
  }

  const { error } = await client
    .from(table)
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(`[TARGET:${table}] ${error.message}`);
  }

  console.log(`Migrado ${rows.length} registro(s) para ${table}.`);
}

async function main() {
  const { truncate } = parseArgs();

  const sourceUrl = requireEnv("SOURCE_SUPABASE_URL");
  const sourceKey = requireEnv("SOURCE_SUPABASE_ANON_KEY");
  const targetUrl = process.env.TARGET_SUPABASE_URL || requireEnv("SUPABASE_URL");
  const targetKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const source = createClient(sourceUrl, sourceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const target = createClient(targetUrl, targetKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Lendo dados da origem Lovable Cloud...");
  const [employees, equipments, allocations] = await Promise.all(TABLES.map((table) => fetchAllRows(source, table)));

  console.log(
    `Origem: employees=${employees.length}, equipments=${equipments.length}, allocations=${allocations.length}`
  );

  await maybeTruncateTarget(target, truncate);

  // Ordem importante para manter FK.
  await upsertRows(target, "employees", employees);
  await upsertRows(target, "equipments", equipments);
  await upsertRows(target, "allocations", allocations);

  console.log("Migracao concluida com sucesso.");
}

main().catch((error) => {
  console.error("Falha na migracao:", error.message);
  process.exit(1);
});

