import * as XLSX from 'xlsx';

type ExportFormat = 'xlsx' | 'csv';

interface ExportOptions {
  filename: string;
  sheetName?: string;
  format: ExportFormat;
}

export const exportService = {
  exportData: (data: Record<string, any>[], options: ExportOptions) => {
    const { filename, sheetName = 'Dados', format } = options;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const extension = format === 'xlsx' ? '.xlsx' : '.csv';
    const bookType = format === 'xlsx' ? 'xlsx' : 'csv';

    XLSX.writeFile(workbook, `${filename}${extension}`, { bookType });
  },

  formatInventoryData: (equipments: { name: string; category: string; classification: string; serialNumber: string; purchaseValue: number; purchaseDate: string; status: string }[]) => {
    return equipments.map(e => ({
      Nome: e.name,
      Categoria: e.category,
      Classificacao: e.classification,
      Patrimonio: e.serialNumber,
      'Valor (R$)': e.purchaseValue,
      'Data de Aquisicao': new Date(e.purchaseDate).toLocaleDateString('pt-BR'),
      Status: e.status,
    }));
  },

  formatAllocationData: (allocations: { employee: { name: string; department: string }; equipment: { name: string; serialNumber: string; purchaseValue: number }; allocatedAt: string; returnedAt?: string; type: string; notes?: string }[]) => {
    return allocations.map(a => ({
      Colaborador: a.employee.name,
      Departamento: a.employee.department,
      Equipamento: a.equipment.name,
      Patrimonio: a.equipment.serialNumber,
      'Valor (R$)': a.equipment.purchaseValue,
      'Data Alocacao': new Date(a.allocatedAt).toLocaleDateString('pt-BR'),
      'Data Devolucao': a.returnedAt ? new Date(a.returnedAt).toLocaleDateString('pt-BR') : '-',
      Status: a.returnedAt ? 'Devolvido' : 'Alocado',
      Tipo: a.type === 'onboarding' ? 'Entrega' : 'Devolucao',
      Observacoes: a.notes || '',
    }));
  },

  formatAuditData: (entries: { date: string; actionLabel: string; performedByName: string | null; equipmentName: string; serialNumber: string; beneficiaryName: string; beneficiaryDepartment: string; beneficiaryStatus: string }[]) => {
    return entries.map(e => ({
      Data: new Date(e.date).toLocaleDateString('pt-BR'),
      Hora: new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      Acao: e.actionLabel,
      Responsavel: e.performedByName || 'Sistema / Legado',
      Equipamento: e.equipmentName,
      Patrimonio: e.serialNumber,
      Beneficiario: e.beneficiaryName,
      Departamento: e.beneficiaryDepartment,
      'Status Beneficiario': e.beneficiaryStatus,
    }));
  },
};
