import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentClassification, STATION_CATEGORIES, FIELD_CATEGORIES } from '@/types';
import { mockEquipments } from '@/mock/db';

// In-memory storage (will be replaced with Supabase)
let equipments: Equipment[] = [...mockEquipments];

// Helper to determine classification from category
export const getClassificationFromCategory = (category: EquipmentCategory): EquipmentClassification => {
  if (FIELD_CATEGORIES.includes(category)) return 'field';
  return 'station';
};

export const equipmentService = {
  getAll: async (): Promise<Equipment[]> => {
    return [...equipments];
  },

  getById: async (id: string): Promise<Equipment | undefined> => {
    return equipments.find(e => e.id === id);
  },

  getByStatus: async (status: EquipmentStatus): Promise<Equipment[]> => {
    return equipments.filter(e => e.status === status);
  },

  getByCategory: async (category: EquipmentCategory): Promise<Equipment[]> => {
    return equipments.filter(e => e.category === category);
  },

  getByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    return equipments.filter(e => e.classification === classification);
  },

  getAvailableByClassification: async (classification: EquipmentClassification): Promise<Equipment[]> => {
    return equipments.filter(e => e.classification === classification && e.status === 'available');
  },

  create: async (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Equipment> => {
    const newEquipment: Equipment = {
      ...data,
      status: 'available',
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    equipments.push(newEquipment);
    return newEquipment;
  },

  update: async (id: string, data: Partial<Equipment>): Promise<Equipment | undefined> => {
    const index = equipments.findIndex(e => e.id === id);
    if (index === -1) return undefined;

    equipments[index] = {
      ...equipments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return equipments[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const index = equipments.findIndex(e => e.id === id);
    if (index === -1) return false;
    equipments.splice(index, 1);
    return true;
  },

  getTotalValue: async (): Promise<number> => {
    return equipments.reduce((sum, e) => sum + e.purchaseValue, 0);
  },

  getStats: async () => {
    const total = equipments.length;
    const available = equipments.filter(e => e.status === 'available').length;
    const allocated = equipments.filter(e => e.status === 'allocated').length;
    const maintenance = equipments.filter(e => e.status === 'maintenance').length;
    const reserved = equipments.filter(e => e.status === 'reserved').length;
    const totalValue = equipments.reduce((sum, e) => sum + e.purchaseValue, 0);
    
    const stationTotal = equipments.filter(e => e.classification === 'station').length;
    const fieldTotal = equipments.filter(e => e.classification === 'field').length;

    return { total, available, allocated, maintenance, reserved, totalValue, stationTotal, fieldTotal };
  },
};
