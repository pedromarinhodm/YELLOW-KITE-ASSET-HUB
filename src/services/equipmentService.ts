import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentClassification, FIELD_CATEGORIES } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const getClassificationFromCategory = (category: EquipmentCategory): EquipmentClassification => {
  if (FIELD_CATEGORIES.includes(category)) return 'field';
  return 'station';
};

const mapRow = (row: any): Equipment => ({
  id: row.id,
  name: row.name,
  category: row.category as EquipmentCategory,
  classification: row.classification as EquipmentClassification,
  serialNumber: row.serial_number,
  purchaseValue: Number(row.purchase_value),
  purchaseDate: row.purchase_date,
  status: row.status as EquipmentStatus,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const equipmentService = {
  getAll: async (): Promise<Equipment[]> => {
    const { data, error } = await supabase.from('equipments').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getById: async (id: string): Promise<Equipment | undefined> => {
    const { data, error } = await supabase.from('equipments').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : undefined;
  },

  getByStatus: async (status: EquipmentStatus): Promise<Equipment[]> => {
    const { data, error } = await supabase.from('equipments').select('*').eq('status', status);
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getByCategory: async (category: EquipmentCategory): Promise<Equipment[]> => {
    const { data, error } = await supabase.from('equipments').select('*').eq('category', category);
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    const { data, error } = await supabase.from('equipments').select('*').eq('classification', classification);
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getAvailableByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    const { data, error } = await supabase.from('equipments').select('*').eq('classification', classification).eq('status', 'available');
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  create: async (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Equipment> => {
    const { data: row, error } = await supabase.from('equipments').insert({
      name: data.name,
      category: data.category,
      classification: data.classification,
      serial_number: data.serialNumber,
      purchase_value: data.purchaseValue,
      purchase_date: data.purchaseDate,
      status: 'available',
    }).select().single();
    if (error) throw error;
    return mapRow(row);
  },

  update: async (id: string, data: Partial<Equipment>): Promise<Equipment | undefined> => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.classification !== undefined) updateData.classification = data.classification;
    if (data.serialNumber !== undefined) updateData.serial_number = data.serialNumber;
    if (data.purchaseValue !== undefined) updateData.purchase_value = data.purchaseValue;
    if (data.purchaseDate !== undefined) updateData.purchase_date = data.purchaseDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

    const { data: row, error } = await supabase.from('equipments').update(updateData).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return row ? mapRow(row) : undefined;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('equipments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getTotalValue: async (): Promise<number> => {
    const { data, error } = await supabase.from('equipments').select('purchase_value');
    if (error) throw error;
    return (data || []).reduce((sum, e) => sum + Number(e.purchase_value), 0);
  },

  getStats: async () => {
    const { data, error } = await supabase.from('equipments').select('status, classification, purchase_value');
    if (error) throw error;
    const items = data || [];
    return {
      total: items.length,
      available: items.filter(e => e.status === 'available').length,
      allocated: items.filter(e => e.status === 'allocated').length,
      maintenance: items.filter(e => e.status === 'maintenance').length,
      reserved: items.filter(e => e.status === 'reserved').length,
      totalValue: items.reduce((sum, e) => sum + Number(e.purchase_value), 0),
      stationTotal: items.filter(e => e.classification === 'station').length,
      fieldTotal: items.filter(e => e.classification === 'field').length,
    };
  },
};
