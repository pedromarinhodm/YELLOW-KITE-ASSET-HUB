import { supabaseAdmin } from "../config/supabase.js";

function normalizeDepartment(value) {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export async function listEmployees({ includeInactive, department }) {
  let query = supabaseAdmin.from("employees").select("*").order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("status", "Ativo");
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!department) return data;

  return (data || []).filter((row) => normalizeDepartment(row.department) === normalizeDepartment(department));
}

export async function getEmployeeById(id) {
  const { data, error } = await supabaseAdmin.from("employees").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEmployee(payload) {
  const { name, role, email, department, status } = payload;
  const { data, error } = await supabaseAdmin
    .from("employees")
    .insert({ name, role, email, department, status: status || "Ativo" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id, payload) {
  const { data, error } = await supabaseAdmin.from("employees").update(payload).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id) {
  const { error } = await supabaseAdmin.from("employees").delete().eq("id", id);
  if (error) throw error;
}

export async function listDepartments() {
  const { data, error } = await supabaseAdmin.from("employees").select("department");
  if (error) throw error;
  return [...new Set((data || []).map((row) => row.department))];
}
