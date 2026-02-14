import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentClassification, FIELD_CATEGORIES } from '@/types';
import { apiClient } from './apiClient';

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
    const data = await apiClient.get<any[]>('/equipments');
    return (data || []).map(mapRow);
  },

  getById: async (id: string): Promise<Equipment | undefined> => {
    try {
      const data = await apiClient.get<any>(`/equipments/${id}`);
      return data ? mapRow(data) : undefined;
    } catch {
      return undefined;
    }
  },

  getByStatus: async (status: EquipmentStatus): Promise<Equipment[]> => {
    const data = await apiClient.get<any[]>(`/equipments?status=${status}`);
    return (data || []).map(mapRow);
  },

  getByCategory: async (category: EquipmentCategory): Promise<Equipment[]> => {
    const data = await apiClient.get<any[]>(`/equipments?category=${category}`);
    return (data || []).map(mapRow);
  },

  getByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    const data = await apiClient.get<any[]>(`/equipments?classification=${classification}`);
    return (data || []).map(mapRow);
  },

  getAvailableByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    const data = await apiClient.get<any[]>(`/equipments?classification=${classification}&status=available`);
    return (data || []).map(mapRow);
  },

  create: async (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Equipment> => {
    const row = await apiClient.post<any>('/equipments', {
      name: data.name,
      category: data.category,
      classification: data.classification,
      serial_number: data.serialNumber,
      purchase_value: data.purchaseValue,
      purchase_date: data.purchaseDate,
      status: 'available',
      image_url: data.imageUrl || null,
    });
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

    try {
      const row = await apiClient.patch<any>(`/equipments/${id}`, updateData);
      return row ? mapRow(row) : undefined;
    } catch {
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete<void>(`/equipments/${id}`);
    return true;
  },

  getTotalValue: async (): Promise<number> => {
    const rows = await apiClient.get<any[]>('/equipments');
    return (rows || []).reduce((sum, e) => sum + Number(e.purchase_value), 0);
  },

  getStats: async () => {
    const data = await apiClient.get<any[]>('/equipments');
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
