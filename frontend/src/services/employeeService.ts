import { Employee, EmployeeStatus } from '@/types';
import { apiClient } from './apiClient';

const mapRow = (row: any): Employee => ({
  id: row.id,
  name: row.name,
  role: row.role,
  email: row.email,
  department: row.department,
  status: row.status || 'Ativo',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const employeeService = {
  /** Returns only active employees by default */
  getAll: async (includeInactive = false): Promise<Employee[]> => {
    const query = includeInactive ? '?includeInactive=true' : '';
    const data = await apiClient.get<any[]>(`/employees${query}`);
    return (data || []).map(mapRow);
  },

  getById: async (id: string): Promise<Employee | undefined> => {
    try {
      const row = await apiClient.get<any>(`/employees/${id}`);
      return row ? mapRow(row) : undefined;
    } catch {
      return undefined;
    }
  },

  getByDepartment: async (department: string): Promise<Employee[]> => {
    const data = await apiClient.get<any[]>('/employees?includeInactive=true');
    return (data || []).filter((row) => row.department === department).map(mapRow);
  },

  create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Employee> => {
    const row = await apiClient.post<any>('/employees', {
      name: data.name,
      role: data.role,
      email: data.email,
      department: data.department,
    });
    return mapRow(row);
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee | undefined> => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status !== undefined) updateData.status = data.status;

    try {
      const row = await apiClient.patch<any>(`/employees/${id}`, updateData);
      return row ? mapRow(row) : undefined;
    } catch {
      return undefined;
    }
  },

  /** Soft-delete: sets status to Desligado */
  deactivate: async (id: string, status: EmployeeStatus = 'Desligado'): Promise<Employee | undefined> => {
    try {
      const row = await apiClient.patch<any>(`/employees/${id}`, { status });
      return row ? mapRow(row) : undefined;
    } catch {
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete<void>(`/employees/${id}`);
    return true;
  },

  getDepartments: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/employees/departments');
  },
};
