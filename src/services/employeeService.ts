import { Employee, EmployeeStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
    let query = supabase.from('employees').select('*').order('name');
    if (!includeInactive) {
      query = query.eq('status', 'Ativo');
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  getById: async (id: string): Promise<Employee | undefined> => {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : undefined;
  },

  getByDepartment: async (department: string): Promise<Employee[]> => {
    const { data, error } = await supabase.from('employees').select('*').eq('department', department);
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Employee> => {
    const { data: row, error } = await supabase.from('employees').insert({
      name: data.name,
      role: data.role,
      email: data.email,
      department: data.department,
    }).select().single();
    if (error) throw error;
    return mapRow(row);
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee | undefined> => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: row, error } = await supabase.from('employees').update(updateData).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return row ? mapRow(row) : undefined;
  },

  /** Soft-delete: sets status to Desligado */
  deactivate: async (id: string, status: EmployeeStatus = 'Desligado'): Promise<Employee | undefined> => {
    const { data: row, error } = await supabase.from('employees').update({ status }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return row ? mapRow(row) : undefined;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getDepartments: async (): Promise<string[]> => {
    const { data, error } = await supabase.from('employees').select('department');
    if (error) throw error;
    return [...new Set((data || []).map((e: any) => e.department))];
  },
};
