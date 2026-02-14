import { supabaseAdmin } from "../config/supabase.js";

export async function listAllocations({ activeOnly, employeeId }) {
  let query = supabaseAdmin
    .from("allocations")
    .select("*, employees(*), equipments(*)")
    .order("allocated_at", { ascending: false });

  if (activeOnly) query = query.is("returned_at", null);
  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAllocationById(id) {
  const { data, error } = await supabaseAdmin.from("allocations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function allocateEquipments(payload) {
  const { employee_id, equipment_ids, allocated_at, notes, type, return_deadline } = payload;

  const rows = equipment_ids.map((equipment_id) => ({
    employee_id,
    equipment_id,
    allocated_at: allocated_at || new Date().toISOString(),
    notes: notes || null,
    type: type || "onboarding",
    return_deadline: return_deadline || null,
  }));

  const { data, error } = await supabaseAdmin.from("allocations").insert(rows).select("*");
  if (error) throw error;

  const { error: equipmentUpdateError } = await supabaseAdmin.from("equipments").update({ status: "allocated" }).in("id", equipment_ids);
  if (equipmentUpdateError) throw equipmentUpdateError;

  return data;
}

export async function returnAllocation(id, payload) {
  const existing = await getAllocationById(id);
  if (!existing) return null;

  const destination = payload.destination || "available";
  const notes = payload.notes ?? existing.notes;

  const { data, error } = await supabaseAdmin
    .from("allocations")
    .update({
      returned_at: payload.returned_at || new Date().toISOString(),
      type: "offboarding",
      notes,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  const { error: equipmentError } = await supabaseAdmin
    .from("equipments")
    .update({ status: destination })
    .eq("id", existing.equipment_id);

  if (equipmentError) throw equipmentError;

  return data;
}
