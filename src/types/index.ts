// Equipment Management System Types

export type EquipmentStatus = 'available' | 'allocated' | 'maintenance' | 'reserved';

// Classificação: Estação (fixos) vs Campo (rotativos)
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

// Categorias de estação (fixos/híbridos)
export const STATION_CATEGORIES: EquipmentCategory[] = [
  'notebook', 'monitor', 'keyboard', 'mouse', 'headset', 'webcam'
];

// Categorias de campo (rotativos/externos)
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

// Reservas para equipamentos de campo
export interface Reservation {
  id: string;
  employeeId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  pickedUpAt?: string;
  returnedAt?: string;
  notes?: string;
  status: 'pending' | 'active' | 'returned' | 'overdue';
  createdAt: string;
}

export interface ReservationWithDetails extends Reservation {
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
  station: 'Equipamento de Estação',
  field: 'Equipamento de Campo',
};

export const RESERVATION_STATUS_LABELS: Record<Reservation['status'], string> = {
  pending: 'Agendada',
  active: 'Em Uso',
  returned: 'Devolvido',
  overdue: 'Atrasado',
};
