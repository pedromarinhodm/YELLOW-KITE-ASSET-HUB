import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Building, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { employeeService } from '@/services/employeeService';
import { allocationService } from '@/services/allocationService';
import { Employee, AllocationWithDetails } from '@/types';
import { toast } from 'sonner';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeAllocations, setEmployeeAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    department: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const loadEmployees = async () => {
    const data = await employeeService.getAll();
    setEmployees(data);
    setLoading(false);
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(
      e =>
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', email: '', department: '' });
    setEditingEmployee(null);
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        role: employee.role,
        email: employee.email,
        department: employee.department,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      await employeeService.update(editingEmployee.id, formData);
      toast.success('Colaborador atualizado com sucesso!');
    } else {
      await employeeService.create(formData);
      toast.success('Colaborador cadastrado com sucesso!');
    }

    await loadEmployees();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await employeeService.delete(deleteId);
      toast.success('Colaborador removido com sucesso!');
      await loadEmployees();
      setDeleteId(null);
    }
  };

  const handleViewAllocations = async (employee: Employee) => {
    const allocations = await allocationService.getActiveByEmployee(employee.id);
    setEmployeeAllocations(allocations);
    setSelectedEmployee(employee);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie os colaboradores</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao.silva@yellowkite.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Designer UX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={formData.department}
                    onValueChange={value => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Criação">Criação</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Audio Visual">Audio Visual</SelectItem>
                      <SelectItem value="Rocket">Rocket</SelectItem>
                      <SelectItem value="Lead Zeppelin">Lead Zeppelin</SelectItem>
                      <SelectItem value="Engenharia de Soluções">Engenharia de Soluções</SelectItem>
                      <SelectItem value="Growth e Tecnologia">Growth e Tecnologia</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="RH">RH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou departamento..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee List */}
      <div className="grid gap-3">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(employee => (
            <div
              key={employee.id}
              className="card-minimal flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {employee.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{employee.role}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-[180px]">{employee.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>{employee.department}</span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewAllocations(employee)}
                  className="h-9 w-9 text-muted-foreground hover:text-primary"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(employee)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(employee.id)}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="card-minimal text-center py-12">
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
          </div>
        )}
      </div>

      {/* Employee Allocations Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Equipamentos de {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {employeeAllocations.length > 0 ? (
              employeeAllocations.map(allocation => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted"
                >
                  <div>
                    <p className="font-medium">{allocation.equipment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {allocation.equipment.serialNumber}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Desde {new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum equipamento alocado
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este colaborador? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
