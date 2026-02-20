import { Allocation, AllocationWithDetails } from '@/types';
import { apiClient } from './apiClient';

const mapRow = (row: any): Allocation => ({
  id: row.id,
  employeeId: row.employee_id,
  equipmentId: row.equipment_id,
  allocatedAt: row.allocated_at,
  returnedAt: row.returned_at,
  notes: row.notes,
  type: row.type,
  termSigned: row.term_signed,
  termSignedAt: row.term_signed_at,
  returnDeadline: row.return_deadline,
  movementType: row.movement_type,
  performedByName: row.performed_by_name || undefined,
  returnedByName: row.returned_by_name || undefined,
});

const mapRowWithDetails = (row: any): AllocationWithDetails => ({
  ...mapRow(row),
  employee: {
    id: row.employees.id,
    name: row.employees.name,
    role: row.employees.role,
    email: row.employees.email,
    department: row.employees.department,
    status: row.employees.status || 'Ativo',
    createdAt: row.employees.created_at,
    updatedAt: row.employees.updated_at,
  },
  equipment: {
    id: row.equipments.id,
    name: row.equipments.name,
    category: row.equipments.category,
    classification: row.equipments.classification,
    serialNumber: row.equipments.serial_number,
    purchaseValue: Number(row.equipments.purchase_value),
    purchaseDate: row.equipments.purchase_date,
    status: row.equipments.status,
    imageUrl: row.equipments.image_url,
    createdAt: row.equipments.created_at,
    updatedAt: row.equipments.updated_at,
  },
});

export const allocationService = {
  getAll: async (): Promise<Allocation[]> => {
    const data = await apiClient.get<any[]>('/allocations');
    return (data || []).map(mapRow);
  },

  getAllWithDetails: async (): Promise<AllocationWithDetails[]> => {
    const data = await apiClient.get<any[]>('/allocations');
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  getByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const data = await apiClient.get<any[]>(`/allocations?employeeId=${employeeId}`);
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  getActiveByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const data = await apiClient.get<any[]>(`/allocations?employeeId=${employeeId}&activeOnly=true`);
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  allocate: async (
    employeeId: string,
    equipmentIds: string[],
    notes?: string,
    allocatedAt?: string,
    returnDeadline?: string,
    performedBy?: { userId: string; name: string },
    movementType?: 'kit' | 'avulsa'
  ): Promise<Allocation[]> => {
    const data = await apiClient.post<any[]>('/allocations', {
      employee_id: employeeId,
      equipment_ids: equipmentIds,
      allocated_at: allocatedAt || new Date().toISOString(),
      notes,
      return_deadline: returnDeadline || null,
      performed_by: performedBy?.userId || null,
      performed_by_name: performedBy?.name || null,
      movement_type: movementType || 'kit',
    });

    return (data || []).map(mapRow);
  },

  deallocateBatch: async (
    entries: { allocationId: string; notes?: string; destination?: 'available' | 'maintenance' }[],
    returnedAt?: string,
    performedBy?: { userId: string; name: string }
  ): Promise<Allocation[]> => {
    if (entries.length === 0) return [];

    const allocationIds = entries.map((entry) => entry.allocationId);
    const notesByAllocation = entries.reduce<Record<string, string>>((acc, entry) => {
      if (entry.notes) acc[entry.allocationId] = entry.notes;
      return acc;
    }, {});
    const destinationsByAllocation = entries.reduce<Record<string, 'available' | 'maintenance'>>((acc, entry) => {
      if (entry.destination) acc[entry.allocationId] = entry.destination;
      return acc;
    }, {});

    const data = await apiClient.post<any[]>('/allocations/return-batch', {
      allocation_ids: allocationIds,
      returned_at: returnedAt || new Date().toISOString(),
      notes_by_allocation: notesByAllocation,
      destinations_by_allocation: destinationsByAllocation,
      returned_by: performedBy?.userId || null,
      returned_by_name: performedBy?.name || null,
    });

    return (data || []).map(mapRow);
  },

  deallocate: async (
    allocationId: string,
    notes?: string,
    returnedAt?: string,
    destination?: 'available' | 'maintenance',
    performedBy?: { userId: string; name: string }
  ): Promise<Allocation | undefined> => {
    const rows = await allocationService.deallocateBatch(
      [{ allocationId, notes, destination }],
      returnedAt,
      performedBy
    );
    return rows[0];
  },

  generateResponsibilityTerm: (
    employee: { name: string; role: string; email: string },
    equipments: { name: string; serialNumber: string; purchaseValue: number }[],
    date: string
  ): string => {
    const equipmentsList = equipments
      .map((e, i) => `${i + 1}. ${e.name} - PatrimÃ´nio: ${e.serialNumber} - Valor: R$ ${e.purchaseValue.toLocaleString('pt-BR')}`)
      .join('\n');

    const totalValue = equipments.reduce((sum, e) => sum + e.purchaseValue, 0);

    return `TERMO DE RESPONSABILIDADE
YELLOW KITE - GESTÃƒO DE EQUIPAMENTOS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Data: ${new Date(date).toLocaleDateString('pt-BR')}

COLABORADOR
Nome: ${employee.name}
Cargo: ${employee.role}
Email: ${employee.email}

EQUIPAMENTOS RECEBIDOS
${equipmentsList}

Valor Total: R$ ${totalValue.toLocaleString('pt-BR')}

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Declaro ter recebido os equipamentos listados acima em perfeito estado de funcionamento e me comprometo a:

1. Zelar pela conservaÃ§Ã£o e bom uso dos equipamentos;
2. Comunicar imediatamente qualquer defeito ou avaria;
3. NÃ£o emprestar ou ceder a terceiros;
4. Devolver os equipamentos em bom estado ao tÃ©rmino do vÃ­nculo.`;
  },

  generateReturnTerm: (
    employee: { name: string; role: string; email: string },
    equipments: { name: string; serialNumber: string; purchaseValue: number }[],
    date: string,
    conditions: Record<string, string>,
    allocations: { id: string; equipment: { name: string } }[]
  ): string => {
    const equipmentsList = equipments
      .map((e, i) => {
        const alloc = allocations.find(a => a.equipment.name === e.name);
        const condition = alloc ? (conditions[alloc.id] || 'NÃ£o informado') : 'NÃ£o informado';
        return `${i + 1}. ${e.name} - PatrimÃ´nio: ${e.serialNumber} - Valor: R$ ${e.purchaseValue.toLocaleString('pt-BR')}\n   Estado de DevoluÃ§Ã£o: ${condition}`;
      })
      .join('\n');

    const totalValue = equipments.reduce((sum, e) => sum + e.purchaseValue, 0);

    return `TERMO DE DEVOLUÃ‡ÃƒO
YELLOW KITE - GESTÃƒO DE EQUIPAMENTOS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Data de DevoluÃ§Ã£o: ${new Date(date).toLocaleDateString('pt-BR')}

COLABORADOR
Nome: ${employee.name}
Cargo: ${employee.role}
Email: ${employee.email}

EQUIPAMENTOS DEVOLVIDOS
${equipmentsList}

Valor Total: R$ ${totalValue.toLocaleString('pt-BR')}

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Declaro ter devolvido os equipamentos listados acima e que a empresa confirma o recebimento dos mesmos nas condiÃ§Ãµes descritas individualmente.`;
  },
};
