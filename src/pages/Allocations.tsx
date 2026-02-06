import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, FileText, History, Search, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { employeeService } from '@/services/employeeService';
import { equipmentService } from '@/services/equipmentService';
import { allocationService } from '@/services/allocationService';
import { Employee, Equipment, AllocationWithDetails } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { toast } from 'sonner';

export default function Allocations() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Onboarding state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [onboardingNotes, setOnboardingNotes] = useState('');

  // Offboarding state
  const [isOffboardingOpen, setIsOffboardingOpen] = useState(false);
  const [activeAllocations, setActiveAllocations] = useState<AllocationWithDetails[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<string>('');
  const [offboardingNotes, setOffboardingNotes] = useState('');

  // Term preview
  const [termPreview, setTermPreview] = useState<string>('');
  const [isTermOpen, setIsTermOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [emps, allAllocs] = await Promise.all([
      employeeService.getAll(),
      allocationService.getAllWithDetails(),
    ]);

    setEmployees(emps);
    setAllocations(allAllocs);
    setLoading(false);
  };

  const loadAvailableEquipments = async () => {
    // Only load station equipment for allocations (fixed assignments)
    const allAvailable = await equipmentService.getByStatus('available');
    const stationEquipments = allAvailable.filter(e => e.classification === 'station');
    setAvailableEquipments(stationEquipments);
  };

  const loadActiveAllocations = async (employeeId: string) => {
    const actives = await allocationService.getActiveByEmployee(employeeId);
    setActiveAllocations(actives);
  };

  const handleOpenOnboarding = async () => {
    await loadAvailableEquipments();
    setSelectedEmployee('');
    setSelectedEquipments([]);
    setOnboardingNotes('');
    setIsOnboardingOpen(true);
  };

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleOnboarding = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0) {
      toast.error('Selecione um colaborador e pelo menos um equipamento');
      return;
    }

    await allocationService.allocate(selectedEmployee, selectedEquipments, onboardingNotes);
    toast.success('Onboarding realizado com sucesso!');
    
    // Generate term
    const employee = employees.find(e => e.id === selectedEmployee)!;
    const equipments = availableEquipments.filter(e => selectedEquipments.includes(e.id));
    const term = allocationService.generateResponsibilityTerm(
      employee,
      equipments,
      new Date().toISOString()
    );
    setTermPreview(term);
    
    setIsOnboardingOpen(false);
    setIsTermOpen(true);
    await loadData();
  };

  const handleOpenOffboarding = async () => {
    setSelectedEmployee('');
    setSelectedAllocation('');
    setActiveAllocations([]);
    setOffboardingNotes('');
    setIsOffboardingOpen(true);
  };

  const handleEmployeeSelectOffboarding = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSelectedAllocation('');
    await loadActiveAllocations(employeeId);
  };

  const handleOffboarding = async () => {
    if (!selectedAllocation) {
      toast.error('Selecione uma alocação para devolver');
      return;
    }

    await allocationService.deallocate(selectedAllocation, offboardingNotes);
    toast.success('Offboarding realizado com sucesso!');
    setIsOffboardingOpen(false);
    await loadData();
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
          <h1 className="text-2xl font-semibold text-foreground">Alocações</h1>
          <p className="text-muted-foreground">Entrega e devolução de equipamentos</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleOpenOnboarding} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Onboarding
          </Button>
          <Button onClick={handleOpenOffboarding} variant="outline" className="gap-2">
            <UserMinus className="w-4 h-4" />
            Offboarding
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou equipamento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="returned">Devolvidas</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {dateFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateFilter(undefined)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Allocations List */}
      <div className="grid gap-3">
        {(() => {
          const filtered = allocations
            .filter(a => {
              // Status filter
              if (statusFilter === 'active') return !a.returnedAt;
              if (statusFilter === 'returned') return !!a.returnedAt;
              return true;
            })
            .filter(a => {
              const matchesSearch = searchTerm === '' || 
                a.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesDepartment = departmentFilter === 'all' || a.employee.department === departmentFilter;
              
              // Date filter - matches allocatedAt date
              let matchesDate = true;
              if (dateFilter) {
                const allocationDate = new Date(a.allocatedAt);
                matchesDate = 
                  allocationDate.getFullYear() === dateFilter.getFullYear() &&
                  allocationDate.getMonth() === dateFilter.getMonth() &&
                  allocationDate.getDate() === dateFilter.getDate();
              }
              
              return matchesSearch && matchesDepartment && matchesDate;
            });
          
          return filtered.length > 0 ? (
            filtered.map(allocation => (
              <div key={allocation.id} className={cn(
                "card-minimal flex flex-col sm:flex-row sm:items-center gap-4",
                allocation.returnedAt && "opacity-70"
              )}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    allocation.returnedAt ? "bg-muted" : "bg-primary"
                  )}>
                    <span className={cn(
                      "text-sm font-semibold",
                      allocation.returnedAt ? "text-muted-foreground" : "text-primary-foreground"
                    )}>
                      {allocation.employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{allocation.employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{allocation.employee.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <CategoryIcon category={allocation.equipment.category} className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{allocation.equipment.name}</p>
                    <p className="text-xs text-muted-foreground">{allocation.equipment.serialNumber}</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-right">
                  {allocation.returnedAt ? (
                    <>
                      <p>{new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')} → {new Date(allocation.returnedAt).toLocaleDateString('pt-BR')}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Devolvido
                      </span>
                    </>
                  ) : (
                    <>
                      <p>{new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Ativa
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card-minimal text-center py-12">
              <p className="text-muted-foreground">Nenhuma alocação encontrada</p>
            </div>
          );
        })()}
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding - Entrega de Equipamentos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipamentos Disponíveis</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-xl p-2 space-y-2">
                {availableEquipments.length > 0 ? (
                  availableEquipments.map(eq => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleToggleEquipment(eq.id)}
                    >
                      <Checkbox checked={selectedEquipments.includes(eq.id)} />
                      <CategoryIcon category={eq.category} className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.serialNumber}</p>
                      </div>
                      <span className="text-sm font-medium">
                        R$ {eq.purchaseValue.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Nenhum equipamento disponível</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={onboardingNotes}
                onChange={e => setOnboardingNotes(e.target.value)}
                placeholder="Ex: Kit inicial de trabalho"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOnboardingOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOnboarding} disabled={!selectedEmployee || selectedEquipments.length === 0}>
                Confirmar Entrega
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offboarding Dialog */}
      <Dialog open={isOffboardingOpen} onOpenChange={setIsOffboardingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Offboarding - Devolução</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={selectedEmployee} onValueChange={handleEmployeeSelectOffboarding}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <div className="space-y-2">
                <Label>Equipamento</Label>
                <Select value={selectedAllocation} onValueChange={setSelectedAllocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAllocations.map(alloc => (
                      <SelectItem key={alloc.id} value={alloc.id}>
                        {alloc.equipment.name} ({alloc.equipment.serialNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeAllocations.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum equipamento alocado</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={offboardingNotes}
                onChange={e => setOffboardingNotes(e.target.value)}
                placeholder="Ex: Equipamento em bom estado"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOffboardingOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOffboarding} disabled={!selectedAllocation}>
                Confirmar Devolução
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Term Preview Dialog */}
      <Dialog open={isTermOpen} onOpenChange={setIsTermOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Termo de Responsabilidade
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[400px]">
              {termPreview}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsTermOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                navigator.clipboard.writeText(termPreview);
                toast.success('Termo copiado!');
              }}>
                Copiar Termo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
