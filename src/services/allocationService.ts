import { Allocation, AllocationWithDetails } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { equipmentService } from './equipmentService';

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
    const { data, error } = await supabase.from('allocations').select('*').order('allocated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getAllWithDetails: async (): Promise<AllocationWithDetails[]> => {
    const { data, error } = await supabase
      .from('allocations')
      .select('*, employees(*), equipments(*)')
      .order('allocated_at', { ascending: false });
    if (error) throw error;
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  getByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const { data, error } = await supabase
      .from('allocations')
      .select('*, employees(*), equipments(*)')
      .eq('employee_id', employeeId)
      .order('allocated_at', { ascending: false });
    if (error) throw error;
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  getActiveByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const { data, error } = await supabase
      .from('allocations')
      .select('*, employees(*), equipments(*)')
      .eq('employee_id', employeeId)
      .is('returned_at', null)
      .order('allocated_at', { ascending: false });
    if (error) throw error;
    return (data || []).filter(r => r.employees && r.equipments).map(mapRowWithDetails);
  },

  allocate: async (
    employeeId: string,
    equipmentIds: string[],
    notes?: string,
    allocatedAt?: string,
    returnDeadline?: string
  ): Promise<Allocation[]> => {
    const rows = equipmentIds.map(equipmentId => ({
      employee_id: employeeId,
      equipment_id: equipmentId,
      allocated_at: allocatedAt || new Date().toISOString(),
      type: 'onboarding',
      notes,
      return_deadline: returnDeadline || null,
    }));

    const { data, error } = await supabase.from('allocations').insert(rows).select();
    if (error) throw error;

    // Update equipment statuses
    for (const equipmentId of equipmentIds) {
      await equipmentService.update(equipmentId, { status: 'allocated' });
    }

    return (data || []).map(mapRow);
  },

  deallocate: async (allocationId: string, notes?: string, returnedAt?: string, destination?: 'available' | 'maintenance'): Promise<Allocation | undefined> => {
    // First get the allocation to find equipment id
    const { data: existing, error: fetchError } = await supabase
      .from('allocations')
      .select('*')
      .eq('id', allocationId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return undefined;

    const { data: row, error } = await supabase
      .from('allocations')
      .update({
        returned_at: returnedAt || new Date().toISOString(),
        type: 'offboarding',
        notes: notes || existing.notes,
      })
      .eq('id', allocationId)
      .select()
      .maybeSingle();
    if (error) throw error;

    // Update equipment status
    const newStatus = destination || 'available';
    await equipmentService.update(existing.equipment_id, { status: newStatus });

    return row ? mapRow(row) : undefined;
  },

  generateResponsibilityTerm: (
    employee: { name: string; role: string; email: string },
    equipments: { name: string; serialNumber: string; purchaseValue: number }[],
    date: string
  ): string => {
    const equipmentsList = equipments
      .map((e, i) => `${i + 1}. ${e.name} - Patrimônio: ${e.serialNumber} - Valor: R$ ${e.purchaseValue.toLocaleString('pt-BR')}`)
      .join('\n');

    const totalValue = equipments.reduce((sum, e) => sum + e.purchaseValue, 0);

    return `
═══════════════════════════════════════════════════════════════
                    TERMO DE RESPONSABILIDADE
                    YELLOW KITE - GESTÃO DE EQUIPAMENTOS
═══════════════════════════════════════════════════════════════

Data: ${new Date(date).toLocaleDateString('pt-BR')}

COLABORADOR:
Nome: ${employee.name}
Cargo: ${employee.role}
Email: ${employee.email}

EQUIPAMENTOS RECEBIDOS:
${equipmentsList}

VALOR TOTAL: R$ ${totalValue.toLocaleString('pt-BR')}

═══════════════════════════════════════════════════════════════

Declaro ter recebido os equipamentos listados acima em perfeito
estado de funcionamento e me comprometo a:

1. Zelar pela conservação e bom uso dos equipamentos;
2. Comunicar imediatamente qualquer defeito ou avaria;
3. Não emprestar ou ceder a terceiros;
4. Devolver os equipamentos em bom estado ao término do vínculo.

═══════════════════════════════════════════════════════════════

_________________________          _________________________
   Colaborador                        RH Yellow Kite

═══════════════════════════════════════════════════════════════
    `.trim();
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
        const condition = alloc ? (conditions[alloc.id] || 'Não informado') : 'Não informado';
        return `${i + 1}. ${e.name} - Patrimônio: ${e.serialNumber} - Valor: R$ ${e.purchaseValue.toLocaleString('pt-BR')}\n   Estado de Devolução: ${condition}`;
      })
      .join('\n');

    const totalValue = equipments.reduce((sum, e) => sum + e.purchaseValue, 0);

    return `
═══════════════════════════════════════════════════════════════
                    TERMO DE DEVOLUÇÃO
                    YELLOW KITE - GESTÃO DE EQUIPAMENTOS
═══════════════════════════════════════════════════════════════

Data de Devolução: ${new Date(date).toLocaleDateString('pt-BR')}

COLABORADOR:
Nome: ${employee.name}
Cargo: ${employee.role}
Email: ${employee.email}

EQUIPAMENTOS DEVOLVIDOS:
${equipmentsList}

VALOR TOTAL: R$ ${totalValue.toLocaleString('pt-BR')}

═══════════════════════════════════════════════════════════════

Declaro ter devolvido os equipamentos listados acima e que a
empresa confirma o recebimento dos mesmos nas condições
descritas individualmente.

═══════════════════════════════════════════════════════════════

_________________________          _________________________
   Colaborador                        RH Yellow Kite

═══════════════════════════════════════════════════════════════
    `.trim();
  },
};
