import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmployeeCombobox } from '@/components/EmployeeCombobox';
import { employeeService } from '@/services/employeeService';
import { allocationService } from '@/services/allocationService';
import { Employee, AllocationWithDetails } from '@/types';
import { toast } from 'sonner';
import { Package, FileText, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OffboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
  employeeName?: string;
  onSuccess?: () => void;
}

export function OffboardingModal({
  open,
  onOpenChange,
  employeeId: initialEmployeeId,
  employeeName: initialEmployeeName,
  onSuccess,
}: OffboardingModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [activeAllocations, setActiveAllocations] = useState<AllocationWithDetails[]>([]);
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [returnDestinations, setReturnDestinations] = useState<Record<string, 'available' | 'maintenance'>>({});

  // Term preview
  const [termPreview, setTermPreview] = useState('');
  const [isTermOpen, setIsTermOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadEmployees();
      if (initialEmployeeId) {
        setSelectedEmployeeId(initialEmployeeId);
        setSelectedEmployeeName(initialEmployeeName || '');
        loadActiveAllocations(initialEmployeeId);
      } else {
        setSelectedEmployeeId('');
        setSelectedEmployeeName('');
        setActiveAllocations([]);
        setSelectedAllocations([]);
      }
    }
  }, [open, initialEmployeeId, initialEmployeeName]);

  const loadEmployees = async () => {
    try {
      const emps = await employeeService.getAll();
      setEmployees(emps);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadActiveAllocations = async (empId: string) => {
    setLoadingData(true);
    try {
      const actives = await allocationService.getActiveByEmployee(empId);
      setActiveAllocations(actives);
      setSelectedAllocations(actives.map(a => a.id));
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleEmployeeChange = async (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    setSelectedEmployeeName(emp?.name || '');
    setSelectedAllocations([]);
    setReturnDestinations({});
    await loadActiveAllocations(empId);
  };

  const handleToggleAllocation = (allocationId: string) => {
    setSelectedAllocations(prev =>
      prev.includes(allocationId)
        ? prev.filter(id => id !== allocationId)
        : [...prev, allocationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAllocations.length === activeAllocations.length) {
      setSelectedAllocations([]);
    } else {
      setSelectedAllocations(activeAllocations.map(a => a.id));
    }
  };

  const handleOffboarding = async () => {
    if (selectedAllocations.length === 0) {
      toast.error('Selecione pelo menos um equipamento para devolver');
      return;
    }

    setLoading(true);
    try {
      const entries = selectedAllocations.map((allocationId) => ({
        allocationId,
        notes,
        destination: returnDestinations[allocationId] || 'available',
      }));
      await allocationService.deallocateBatch(entries, returnDate.toISOString());

      // If all allocations returned, deactivate employee
      const allReturned = selectedAllocations.length === activeAllocations.length;
      if (allReturned && selectedEmployeeId) {
        await employeeService.deactivate(selectedEmployeeId, 'Desligado');
      }

      // Generate return term
      const emp = employees.find(e => e.id === selectedEmployeeId);
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
          {},
          activeAllocations
        );

        setTermPreview(term);
        setIsTermOpen(true);
      }

      toast.success(`${selectedAllocations.length} equipamento(s) devolvido(s) com sucesso!${allReturned ? ' Colaborador marcado como Desligado.' : ''}`);
      onSuccess?.();
    } catch (error) {
      console.error('Error during offboarding:', error);
      toast.error('Erro ao processar devolução');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setSelectedEmployeeName('');
    setSelectedAllocations([]);
    setActiveAllocations([]);
    setNotes('');
    setReturnDate(new Date());
    setReturnDestinations({});
    setTermPreview('');
    setIsTermOpen(false);
    onOpenChange(false);
  };

  const totalValue = activeAllocations
    .filter(a => selectedAllocations.includes(a.id))
    .reduce((sum, a) => sum + (a.equipment?.purchaseValue || 0), 0);

  const showEmployeeSelector = !initialEmployeeId;

  // Term preview sub-dialog
  if (isTermOpen) {
    return (
      <Dialog open={isTermOpen} onOpenChange={(open) => { setIsTermOpen(open); if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Termo de Devolução
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[350px]">
              {termPreview}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => { setIsTermOpen(false); handleClose(); }}>
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
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offboarding - Devolução de Equipamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Employee Selector */}
          {showEmployeeSelector ? (
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <EmployeeCombobox
                employees={employees}
                value={selectedEmployeeId}
                onValueChange={handleEmployeeChange}
              />
            </div>
          ) : selectedEmployeeName && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-lg">
                  {selectedEmployeeName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedEmployeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {activeAllocations.length} equipamento(s) alocado(s)
                </p>
              </div>
            </div>
          )}

          {/* Return Date */}
          {selectedEmployeeId && (
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Allocations List */}
          {selectedEmployeeId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conferência de Itens</Label>
                {activeAllocations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {selectedAllocations.length === activeAllocations.length
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </Button>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-2">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : activeAllocations.length > 0 ? (
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
                        <div className="pl-10 pr-3 pb-2">
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
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mb-2" />
                    <p className="text-sm">Nenhum equipamento alocado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Summary */}
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

          {/* Notes */}
          {selectedEmployeeId && (
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Colaborador desligado, equipamentos conferidos"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleOffboarding} 
              disabled={loading || selectedAllocations.length === 0}
            >
              {loading ? 'Processando...' : `Confirmar Devolução (${selectedAllocations.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
