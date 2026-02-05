// Equipment Management System Types

export type EquipmentStatus = 'available' | 'allocated' | 'maintenance';

export type EquipmentCategory = 
  | 'notebook' 
  | 'monitor' 
  | 'keyboard' 
  | 'mouse' 
  | 'headset' 
  | 'webcam' 
  | 'other';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  serialNumber: string;
  purchaseValue: number;
  purchaseDate: string;
  status: EquipmentStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  employeeId: string;
  equipmentId: string;
  allocatedAt: string;
  returnedAt?: string;
  notes?: string;
  type: 'onboarding' | 'offboarding';
}

export interface AllocationWithDetails extends Allocation {
  employee: Employee;
  equipment: Equipment;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  notebook: 'Notebook',
  monitor: 'Monitor',
  keyboard: 'Teclado',
  mouse: 'Mouse',
  headset: 'Headset',
  webcam: 'Webcam',
  other: 'Outro',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponível',
  allocated: 'Alocado',
  maintenance: 'Manutenção',
};
