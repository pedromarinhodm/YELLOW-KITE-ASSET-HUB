import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, FileText, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const equipments = await equipmentService.getByStatus('available');
    setAvailableEquipments(equipments);
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

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Ativas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-3">
            {allocations.filter(a => !a.returnedAt).length > 0 ? (
              allocations
                .filter(a => !a.returnedAt)
                .map(allocation => (
                  <div key={allocation.id} className="card-minimal flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-foreground">
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

                    <div className="text-sm text-muted-foreground">
                      {new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))
            ) : (
              <div className="card-minimal text-center py-12">
                <p className="text-muted-foreground">Nenhuma alocação ativa</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="grid gap-3">
            {allocations.filter(a => a.returnedAt).length > 0 ? (
              allocations
                .filter(a => a.returnedAt)
                .map(allocation => (
                  <div key={allocation.id} className="card-minimal flex flex-col sm:flex-row sm:items-center gap-4 opacity-70">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-semibold text-muted-foreground">
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
                      <p>{new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')} → {new Date(allocation.returnedAt!).toLocaleDateString('pt-BR')}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Devolvido
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="card-minimal text-center py-12">
                <p className="text-muted-foreground">Nenhum histórico de devolução</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
