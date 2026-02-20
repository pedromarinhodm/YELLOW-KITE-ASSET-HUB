import { supabaseAdmin } from "../config/supabase.js";

function normalizeDepartment(value) {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export async function listAllocations({ activeOnly, employeeId, department }) {
  let query = supabaseAdmin
    .from("allocations")
    .select("*, employees(*), equipments(*)")
    .order("allocated_at", { ascending: false });

  if (activeOnly) query = query.is("returned_at", null);
  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error) throw error;
  if (!department) return data;

  return (data || []).filter(
    (row) => normalizeDepartment(row.employees?.department) === normalizeDepartment(department)
  );
}

export async function getAllocationById(id) {
  const { data, error } = await supabaseAdmin.from("allocations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function allocateEquipments(payload) {
  const { employee_id, equipment_ids, allocated_at, notes, return_deadline, performed_by, performed_by_name, movement_type } = payload;

  const { data, error } = await supabaseAdmin.rpc("allocate_equipments_atomic", {
    _employee_id: employee_id,
    _equipment_ids: equipment_ids,
    _allocated_at: allocated_at || new Date().toISOString(),
    _notes: notes || null,
    _return_deadline: return_deadline || null,
    _performed_by: performed_by || null,
    _performed_by_name: performed_by_name || null,
    _movement_type: movement_type || "kit",
  });
  if (error) throw error;
  return data;
}

export async function returnAllocation(id, payload) {
  const existing = await getAllocationById(id);
  if (!existing) return null;

  const destination = payload.destination || "available";
  const notesByAllocation = { [id]: payload.notes ?? existing.notes ?? null };
  const destinationsByAllocation = { [id]: destination };

  const { data, error } = await supabaseAdmin.rpc("deallocate_allocations_atomic", {
    _allocation_ids: [id],
    _returned_at: payload.returned_at || new Date().toISOString(),
    _notes_by_allocation: notesByAllocation,
    _destinations_by_allocation: destinationsByAllocation,
    _returned_by: payload.returned_by || null,
    _returned_by_name: payload.returned_by_name || null,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : null;
}

export async function returnAllocationsBatch(payload) {
  const { allocation_ids, returned_at, notes_by_allocation, destinations_by_allocation, returned_by, returned_by_name } = payload;

  const { data, error } = await supabaseAdmin.rpc("deallocate_allocations_atomic", {
    _allocation_ids: allocation_ids,
    _returned_at: returned_at || new Date().toISOString(),
    _notes_by_allocation: notes_by_allocation || {},
    _destinations_by_allocation: destinations_by_allocation || {},
    _returned_by: returned_by || null,
    _returned_by_name: returned_by_name || null,
  });
  if (error) throw error;
  return data || [];
}
