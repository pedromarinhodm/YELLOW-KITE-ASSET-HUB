import { Allocation, AllocationWithDetails } from '@/types';
import { mockAllocations } from '@/mock/db';
import { equipmentService } from './equipmentService';
import { employeeService } from './employeeService';

// In-memory storage (will be replaced with Supabase)
let allocations: Allocation[] = [...mockAllocations];

export const allocationService = {
  getAll: async (): Promise<Allocation[]> => {
    return [...allocations];
  },

  getAllWithDetails: async (): Promise<AllocationWithDetails[]> => {
    const employees = await employeeService.getAll();
    const equipments = await equipmentService.getAll();

    return allocations.map(allocation => ({
      ...allocation,
      employee: employees.find(e => e.id === allocation.employeeId)!,
      equipment: equipments.find(e => e.id === allocation.equipmentId)!,
    })).filter(a => a.employee && a.equipment);
  },

  getByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const all = await allocationService.getAllWithDetails();
    return all.filter(a => a.employeeId === employeeId);
  },

  getActiveByEmployee: async (employeeId: string): Promise<AllocationWithDetails[]> => {
    const all = await allocationService.getByEmployee(employeeId);
    return all.filter(a => !a.returnedAt);
  },

  allocate: async (
    employeeId: string,
    equipmentIds: string[],
    notes?: string,
    allocatedAt?: string
  ): Promise<Allocation[]> => {
    const newAllocations: Allocation[] = [];

    for (const equipmentId of equipmentIds) {
      const allocation: Allocation = {
        id: Date.now().toString() + equipmentId,
        employeeId,
        equipmentId,
        allocatedAt: allocatedAt || new Date().toISOString(),
        type: 'onboarding',
        notes,
      };
      allocations.push(allocation);
      newAllocations.push(allocation);

      // Update equipment status
      await equipmentService.update(equipmentId, { status: 'allocated' });
    }

    return newAllocations;
  },

  deallocate: async (allocationId: string, notes?: string, returnedAt?: string, destination?: 'available' | 'maintenance'): Promise<Allocation | undefined> => {
    const index = allocations.findIndex(a => a.id === allocationId);
    if (index === -1) return undefined;

    allocations[index] = {
      ...allocations[index],
      returnedAt: returnedAt || new Date().toISOString(),
      type: 'offboarding',
      notes: notes || allocations[index].notes,
    };

    // Update equipment status based on destination
    const newStatus = destination || 'available';
    await equipmentService.update(allocations[index].equipmentId, { status: newStatus });

    return allocations[index];
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
};
