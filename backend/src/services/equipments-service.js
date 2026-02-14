import { supabaseAdmin } from "../config/supabase.js";

export async function listEquipments({ status, classification, category }) {
  let query = supabaseAdmin.from("equipments").select("*").order("name", { ascending: true });

  if (status) query = query.eq("status", status);
  if (classification) query = query.eq("classification", classification);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getEquipmentById(id) {
  const { data, error } = await supabaseAdmin.from("equipments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEquipment(payload) {
  const { name, category, classification, serial_number, purchase_value, purchase_date, status, image_url } = payload;

  const { data, error } = await supabaseAdmin
    .from("equipments")
    .insert({
      name,
      category,
      classification,
      serial_number,
      purchase_value,
      purchase_date,
      status: status || "available",
      image_url: image_url || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEquipment(id, payload) {
  const { data, error } = await supabaseAdmin.from("equipments").update(payload).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(id) {
  const { error } = await supabaseAdmin.from("equipments").delete().eq("id", id);
  if (error) throw error;
}
