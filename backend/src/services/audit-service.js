import { supabaseAdmin } from "../config/supabase.js";

export async function listAuditAllocations({ department } = {}) {
  let query = supabaseAdmin
    .from("allocations")
    .select("*, employees(name, department, status), equipments(name, serial_number)")
    .order("allocated_at", { ascending: false });

  if (department) query = query.eq("employees.department", department);

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function listAuditCoordinators() {
  const { data, error } = await supabaseAdmin
    .from("allocations")
    .select("*");

  if (error) throw error;

  const names = new Set();
  for (const row of data || []) {
    if (row.performed_by_name) names.add(row.performed_by_name);
    if (row.returned_by_name) names.add(row.returned_by_name);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
