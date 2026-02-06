// Equipment Management System Types

export type EquipmentStatus = 'available' | 'allocated' | 'maintenance' | 'reserved';

// Classificação: Setup de Mesa (fixos) vs Externas (rotativos)
export type EquipmentClassification = 'station' | 'field';

export type EquipmentCategory = 
  | 'notebook' 
  | 'monitor' 
  | 'keyboard' 
  | 'mouse' 
  | 'headset' 
  | 'webcam' 
  | 'smartphone'
  | 'tripod'
  | 'ringlight'
  | 'camera'
  | 'microphone'
  | 'other';

// Categorias de Setup de Mesa (fixos/híbridos)
export const STATION_CATEGORIES: EquipmentCategory[] = [
  'notebook', 'monitor', 'keyboard', 'mouse', 'headset', 'webcam'
];

// Categorias de Externas (rotativos/externos)
export const FIELD_CATEGORIES: EquipmentCategory[] = [
  'smartphone', 'tripod', 'ringlight', 'camera', 'microphone'
];

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  classification: EquipmentClassification;
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

// Pendência de devolução
export interface OverdueReturn {
  id: string;
  employeeId: string;
  employeeName: string;
  equipmentName: string;
  dueDate: string;
  daysOverdue: number;
  resolved: boolean;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  notebook: 'Notebook',
  monitor: 'Monitor',
  keyboard: 'Teclado',
  mouse: 'Mouse',
  headset: 'Headset',
  webcam: 'Webcam',
  smartphone: 'Smartphone',
  tripod: 'Tripé',
  ringlight: 'Ring Light',
  camera: 'Câmera',
  microphone: 'Microfone',
  other: 'Outro',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponível',
  allocated: 'Alocado',
  maintenance: 'Manutenção',
  reserved: 'Reservado',
};

export const CLASSIFICATION_LABELS: Record<EquipmentClassification, string> = {
  station: 'Equipamento de Setup de Mesa',
  field: 'Equipamento de Externas',
};
