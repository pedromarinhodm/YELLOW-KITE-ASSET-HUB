import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserPlus, UserMinus, FileText, History, Search, CalendarIcon, X, Download } from 'lucide-react';
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
import { Employee, Equipment, AllocationWithDetails, STATION_CATEGORIES, FIELD_CATEGORIES } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmployeeCombobox } from '@/components/EmployeeCombobox';
import { toast } from 'sonner';
import { exportService } from '@/services/exportService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Allocations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilterStart, setDateFilterStart] = useState<Date | undefined>(undefined);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | undefined>(undefined);

  // Onboarding state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [onboardingNotes, setOnboardingNotes] = useState('');
  const [equipmentConditions, setEquipmentConditions] = useState<Record<string, string>>({});
  const [allocationDate, setAllocationDate] = useState<Date>(new Date());
  const [movementType, setMovementType] = useState<'kit' | 'avulsa'>('kit');
  const [environmentFilter, setEnvironmentFilter] = useState<{ station: boolean; field: boolean }>({ station: false, field: false });
  const [returnDeadline, setReturnDeadline] = useState<Date | undefined>(undefined);

  // Offboarding state
  const [isOffboardingOpen, setIsOffboardingOpen] = useState(false);
  const [activeAllocations, setActiveAllocations] = useState<AllocationWithDetails[]>([]);
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [offboardingNotes, setOffboardingNotes] = useState('');
  const [returnConditions, setReturnConditions] = useState<Record<string, string>>({});
  const [returnDestinations, setReturnDestinations] = useState<Record<string, 'available' | 'maintenance'>>({});
  const [returnDate, setReturnDate] = useState<Date>(new Date());

  // Term preview
  const [termPreview, setTermPreview] = useState<string>('');
  const [isTermOpen, setIsTermOpen] = useState(false);
  const [termType, setTermType] = useState<'onboarding' | 'offboarding'>('onboarding');

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL action parameter to auto-open modals
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'onboarding' && !loading) {
      handleOpenOnboarding();
      // Clear the action param after opening
      setSearchParams({});
    } else if (action === 'offboarding' && !loading) {
      handleOpenOffboarding();
      // Clear the action param after opening
      setSearchParams({});
    }
  }, [searchParams, loading]);

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
    const allAvailable = await equipmentService.getByStatus('available');
    setAvailableEquipments(allAvailable);
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
    setEquipmentConditions({});
    setAllocationDate(new Date());
    setMovementType('kit');
    setEnvironmentFilter({ station: false, field: false });
    setReturnDeadline(undefined);
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

    // Build notes with conditions
    const conditionNotes = selectedEquipments
      .map(id => {
        const eq = availableEquipments.find(e => e.id === id);
        const cond = equipmentConditions[id];
        return cond ? `${eq?.name}: ${cond}` : null;
      })
      .filter(Boolean)
      .join('; ');
    const finalNotes = [onboardingNotes, conditionNotes].filter(Boolean).join(' | ');

    await allocationService.allocate(selectedEmployee, selectedEquipments, finalNotes, allocationDate.toISOString());
    
    // Generate term preview
    const employee = employees.find(e => e.id === selectedEmployee)!;
    const equipments = availableEquipments.filter(e => selectedEquipments.includes(e.id));
    const term = allocationService.generateResponsibilityTerm(employee, equipments, allocationDate.toISOString());
    
    setTermPreview(term);
    setTermType('onboarding');
    setIsTermOpen(true);
    
    toast.success('Onboarding realizado com sucesso!');
    setIsOnboardingOpen(false);
    await loadData();
  };

  const handleOpenOffboarding = async () => {
    setSelectedEmployee('');
    setSelectedAllocations([]);
    setActiveAllocations([]);
    setOffboardingNotes('');
    setReturnConditions({});
    setReturnDestinations({});
    setReturnDate(new Date());
    setIsOffboardingOpen(true);
  };

  const handleEmployeeSelectOffboarding = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSelectedAllocations([]);
    setReturnConditions({});
    setReturnDestinations({});
    await loadActiveAllocations(employeeId);
  };

  const handleToggleAllocation = (allocationId: string) => {
    setSelectedAllocations(prev =>
      prev.includes(allocationId)
        ? prev.filter(id => id !== allocationId)
        : [...prev, allocationId]
    );
  };

  const handleOffboarding = async () => {
    if (selectedAllocations.length === 0) {
      toast.error('Selecione pelo menos um equipamento para devolver');
      return;
    }

    for (const allocationId of selectedAllocations) {
      const alloc = activeAllocations.find(a => a.id === allocationId);
      const condition = returnConditions[allocationId] || '';
      const destination = returnDestinations[allocationId] || 'available';
      const notes = [offboardingNotes, condition ? `Estado: ${condition}` : ''].filter(Boolean).join(' | ');
      await allocationService.deallocate(allocationId, notes, returnDate.toISOString(), destination);
    }

    // Check if all allocations are being returned — if so, deactivate employee
    const allReturned = selectedAllocations.length === activeAllocations.length;
    if (allReturned && selectedEmployee) {
      await employeeService.deactivate(selectedEmployee, 'Desligado');
    }

    // Generate return term
    const emp = employees.find(e => e.id === selectedEmployee);
    if (emp) {
      const returnedEquipments = selectedAllocations
        .map(id => activeAllocations.find(a => a.id === id))
        .filter(Boolean)
        .map(a => ({
          name: a!.equipment.name,
          serialNumber: a!.equipment.serialNumber,
          purchaseValue: a!.equipment.purchaseValue,
        }));

      const term = allocationService.generateReturnTerm(
        { name: emp.name, role: emp.role, email: emp.email },
        returnedEquipments,
        returnDate.toISOString(),
        returnConditions,
        activeAllocations
      );
      setTermPreview(term);
      setTermType('offboarding');
      setIsTermOpen(true);
    }

    toast.success(`${selectedAllocations.length} equipamento(s) devolvido(s) com sucesso!${allReturned ? ' Colaborador marcado como Desligado.' : ''}`);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const data = exportService.formatAllocationData(allocations as any);
                exportService.exportData(data, { filename: 'alocacoes', format: 'xlsx', sheetName: 'Alocações' });
                toast.success('Relatório Excel exportado!');
              }}>
                Exportar Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const data = exportService.formatAllocationData(allocations as any);
                exportService.exportData(data, { filename: 'alocacoes', format: 'csv', sheetName: 'Alocações' });
                toast.success('Relatório CSV exportado!');
              }}>
                Exportar CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  !dateFilterStart && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilterStart ? format(dateFilterStart, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilterStart}
                onSelect={setDateFilterStart}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal",
                  !dateFilterEnd && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilterEnd ? format(dateFilterEnd, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilterEnd}
                onSelect={setDateFilterEnd}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {(dateFilterStart || dateFilterEnd) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setDateFilterStart(undefined); setDateFilterEnd(undefined); }}
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
              
              // Date filter - matches allocatedAt within period
              let matchesDate = true;
              if (dateFilterStart || dateFilterEnd) {
                const allocationDate = new Date(a.allocatedAt);
                allocationDate.setHours(0, 0, 0, 0);
                if (dateFilterStart) {
                  const start = new Date(dateFilterStart);
                  start.setHours(0, 0, 0, 0);
                  if (allocationDate < start) matchesDate = false;
                }
                if (dateFilterEnd) {
                  const end = new Date(dateFilterEnd);
                  end.setHours(23, 59, 59, 999);
                  if (allocationDate > end) matchesDate = false;
                }
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Devolvido
                        </span>
                        {allocation.employee.status === 'Desligado' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            Desligado
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Alocado
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
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding - Entrega de Equipamentos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <EmployeeCombobox
                employees={employees}
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              />
            </div>

            {/* Tipo de Movimentação */}
            <div className="space-y-3">
              <Label>Tipo de Movimentação</Label>
              <RadioGroup
                value={movementType}
                onValueChange={(val: 'kit' | 'avulsa') => {
                  setMovementType(val);
                  setReturnDeadline(undefined);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex-1"
                  onClick={() => { setMovementType('kit'); setReturnDeadline(undefined); }}>
                  <RadioGroupItem value="kit" id="mov-kit" />
                  <Label htmlFor="mov-kit" className="cursor-pointer text-sm font-medium">
                    Entrega de Kit
                    <span className="block text-xs text-muted-foreground font-normal">Novo colaborador</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex-1"
                  onClick={() => setMovementType('avulsa')}>
                  <RadioGroupItem value="avulsa" id="mov-avulsa" />
                  <Label htmlFor="mov-avulsa" className="cursor-pointer text-sm font-medium">
                    Alocação Avulsa
                    <span className="block text-xs text-muted-foreground font-normal">Entrega extra ou substituição</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Ambiente do Equipamento */}
            <div className="space-y-3">
              <Label>Ambiente do Equipamento</Label>
              <div className="flex gap-4">
                <div
                  className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex-1"
                  onClick={() => setEnvironmentFilter(prev => ({ ...prev, station: !prev.station }))}
                >
                  <Checkbox checked={environmentFilter.station} />
                  <span className="text-sm font-medium">Setup de Mesa</span>
                </div>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex-1"
                  onClick={() => setEnvironmentFilter(prev => ({ ...prev, field: !prev.field }))}
                >
                  <Checkbox checked={environmentFilter.field} />
                  <span className="text-sm font-medium">Externas</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Alocação</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(allocationDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={allocationDate}
                      onSelect={(d) => d && setAllocationDate(d)}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {movementType === 'avulsa' && (
                <div className="space-y-2">
                  <Label>Prazo de Devolução</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDeadline ? format(returnDeadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar prazo"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDeadline}
                        onSelect={setReturnDeadline}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Equipamentos Disponíveis</Label>
              <div className="max-h-[250px] overflow-y-auto border rounded-xl p-2 space-y-2">
                {(() => {
                  const filtered = availableEquipments.filter(eq => {
                    if (environmentFilter.station && environmentFilter.field) return true;
                    if (environmentFilter.station) return STATION_CATEGORIES.includes(eq.category);
                    if (environmentFilter.field) return FIELD_CATEGORIES.includes(eq.category);
                    return false;
                  });
                  return filtered.length > 0 ? (
                    filtered.map(eq => (
                      <div key={eq.id} className="space-y-2">
                        <div
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
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      {!environmentFilter.station && !environmentFilter.field
                        ? 'Selecione ao menos um ambiente'
                        : 'Nenhum equipamento disponível'}
                    </p>
                  );
                })()}
              </div>
            </div>

            {selectedEquipments.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm text-muted-foreground">
                  {selectedEquipments.length} item(s) selecionado(s)
                </span>
                <span className="font-semibold text-primary">
                  R$ {availableEquipments
                    .filter(e => selectedEquipments.includes(e.id))
                    .reduce((sum, e) => sum + e.purchaseValue, 0)
                    .toLocaleString('pt-BR')}
                </span>
              </div>
            )}

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
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedEmployee || selectedEquipments.length === 0) {
                    toast.error('Selecione um colaborador e pelo menos um equipamento');
                    return;
                  }
                  const employee = employees.find(e => e.id === selectedEmployee)!;
                  const equipments = availableEquipments.filter(e => selectedEquipments.includes(e.id));
                  const term = allocationService.generateResponsibilityTerm(
                    employee,
                    equipments,
                    allocationDate.toISOString()
                  );
                  setTermPreview(term);
                  setTermType('onboarding');
                  setIsTermOpen(true);
                }}
                disabled={!selectedEmployee || selectedEquipments.length === 0}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Gerar Termo
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
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding - Devolução de Equipamentos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <EmployeeCombobox
                employees={employees}
                value={selectedEmployee}
                onValueChange={handleEmployeeSelectOffboarding}
              />
            </div>

            {selectedEmployee && (
              <>
                <div className="space-y-2">
                  <Label>Data de Devolução</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(returnDate, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(d) => d && setReturnDate(d)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Conferência de Itens</Label>
                  <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-2">
                    {activeAllocations.length > 0 ? (
                      activeAllocations.map(alloc => (
                        <div key={alloc.id} className="space-y-2">
                          <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleToggleAllocation(alloc.id)}
                          >
                            <Checkbox checked={selectedAllocations.includes(alloc.id)} />
                            <CategoryIcon category={alloc.equipment.category} className="w-5 h-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{alloc.equipment.name}</p>
                              <p className="text-xs text-muted-foreground">{alloc.equipment.serialNumber}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alloc.allocatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {selectedAllocations.includes(alloc.id) && (
                            <div className="pl-10 pr-3 pb-2 space-y-2">
                              <Select
                                value={returnDestinations[alloc.id] || 'available'}
                                onValueChange={(val: 'available' | 'maintenance') =>
                                  setReturnDestinations(prev => ({
                                    ...prev,
                                    [alloc.id]: val,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs" onClick={e => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Devolver ao Estoque (Disponível)</SelectItem>
                                  <SelectItem value="maintenance">Enviar para Manutenção</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-muted-foreground">Nenhum equipamento alocado</p>
                    )}
                  </div>
                </div>

                {selectedAllocations.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="text-sm text-muted-foreground">
                      {selectedAllocations.length} item(s) conferido(s)
                    </span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {selectedAllocations.filter(id => (returnDestinations[id] || 'available') === 'available').length} → Estoque
                      </span>
                      <span className="text-muted-foreground">
                        {selectedAllocations.filter(id => returnDestinations[id] === 'maintenance').length} → Manutenção
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={offboardingNotes}
                onChange={e => setOffboardingNotes(e.target.value)}
                placeholder="Ex: Colaborador desligado, equipamentos conferidos"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOffboardingOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOffboarding} disabled={selectedAllocations.length === 0}>
                Confirmar Devolução ({selectedAllocations.length})
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
              {termType === 'offboarding' ? 'Termo de Devolução' : 'Termo de Responsabilidade'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[350px]">
              {termPreview}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsTermOpen(false)}>
                Fechar
              </Button>
              <Button variant="outline" onClick={() => {
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
