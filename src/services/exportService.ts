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
      'Nome': e.name,
      'Categoria': e.category,
      'Classificação': e.classification,
      'Nº Série/Patrimônio': e.serialNumber,
      'Valor (R$)': e.purchaseValue,
      'Data de Aquisição': new Date(e.purchaseDate).toLocaleDateString('pt-BR'),
      'Status': e.status,
    }));
  },

  formatAllocationData: (allocations: { employee: { name: string; department: string }; equipment: { name: string; serialNumber: string; purchaseValue: number }; allocatedAt: string; returnedAt?: string; type: string; notes?: string }[]) => {
    return allocations.map(a => ({
      'Colaborador': a.employee.name,
      'Departamento': a.employee.department,
      'Equipamento': a.equipment.name,
      'Nº Série': a.equipment.serialNumber,
      'Valor (R$)': a.equipment.purchaseValue,
      'Data Alocação': new Date(a.allocatedAt).toLocaleDateString('pt-BR'),
      'Data Devolução': a.returnedAt ? new Date(a.returnedAt).toLocaleDateString('pt-BR') : '—',
      'Status': a.returnedAt ? 'Devolvido' : 'Alocado',
      'Tipo': a.type === 'onboarding' ? 'Entrega' : 'Devolução',
      'Observações': a.notes || '',
    }));
  },
};
