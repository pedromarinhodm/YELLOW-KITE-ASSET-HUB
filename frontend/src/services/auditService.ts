import { apiClient } from './apiClient';

export type AuditAction = 'kit' | 'avulsa' | 'devolucao';

export interface AuditEntry {
  id: string;
  allocationId: string;
  action: AuditAction;
  actionLabel: string;
  date: string;
  performedByName: string | null;
  equipmentName: string;
  serialNumber: string;
  beneficiaryName: string;
  beneficiaryDepartment: string;
  beneficiaryStatus: string;
}

const getActionLabel = (action: AuditAction): string => {
  if (action === 'kit') return 'Entrega (Kit Novo)';
  if (action === 'avulsa') return 'Entrega (Avulsa)';
  return 'Devolução';
};

export const auditService = {
  getAuditEntries: async (): Promise<AuditEntry[]> => {
    const data = await apiClient.get<any[]>('/audit');

    const entries: AuditEntry[] = [];

    for (const row of (data || [])) {
      if (!row.employees || !row.equipments) continue;

      const movType: AuditAction = row.movement_type || 'kit';
      const performedByName: string | null = row.performed_by_name || null;
      const returnedByName: string | null = row.returned_by_name || null;

      entries.push({
        id: `${row.id}-delivery`,
        allocationId: row.id,
        action: movType,
        actionLabel: getActionLabel(movType),
        date: row.allocated_at,
        performedByName,
        equipmentName: row.equipments.name,
        serialNumber: row.equipments.serial_number,
        beneficiaryName: row.employees.name,
        beneficiaryDepartment: row.employees.department,
        beneficiaryStatus: row.employees.status,
      });

      if (row.returned_at) {
        entries.push({
          id: `${row.id}-return`,
          allocationId: row.id,
          action: 'devolucao',
          actionLabel: 'Devolução',
          date: row.returned_at,
          performedByName: returnedByName,
          equipmentName: row.equipments.name,
          serialNumber: row.equipments.serial_number,
          beneficiaryName: row.employees.name,
          beneficiaryDepartment: row.employees.department,
          beneficiaryStatus: row.employees.status,
        });
      }
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  },

  getUniqueCoordinators: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/audit/coordinators');
  },
};
