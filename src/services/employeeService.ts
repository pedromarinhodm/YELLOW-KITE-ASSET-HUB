import { Employee } from '@/types';
import { mockEmployees } from '@/mock/db';

// In-memory storage (will be replaced with Supabase)
let employees: Employee[] = [...mockEmployees];

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    return [...employees];
  },

  getById: async (id: string): Promise<Employee | undefined> => {
    return employees.find(e => e.id === id);
  },

  getByDepartment: async (department: string): Promise<Employee[]> => {
    return employees.filter(e => e.department === department);
  },

  create: async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
    const newEmployee: Employee = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employees.push(newEmployee);
    return newEmployee;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee | undefined> => {
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return undefined;

    employees[index] = {
      ...employees[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return employees[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    employees.splice(index, 1);
    return true;
  },

  getDepartments: async (): Promise<string[]> => {
    return [...new Set(employees.map(e => e.department))];
  },
};
