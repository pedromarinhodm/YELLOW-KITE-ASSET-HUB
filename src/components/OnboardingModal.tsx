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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { employeeService } from '@/services/employeeService';
import { equipmentService } from '@/services/equipmentService';
import { allocationService } from '@/services/allocationService';
import { Employee, Equipment, STATION_CATEGORIES, FIELD_CATEGORIES } from '@/types';
import { toast } from 'sonner';
import { UserPlus, Package, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OnboardingModal({
  open,
  onOpenChange,
  onSuccess,
}: OnboardingModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [equipmentConditions, setEquipmentConditions] = useState<Record<string, string>>({});
  const [allocationDate, setAllocationDate] = useState<Date>(new Date());
  const [movementType, setMovementType] = useState<'kit' | 'avulsa'>('kit');
  const [environmentFilter, setEnvironmentFilter] = useState<{ station: boolean; field: boolean }>({ station: false, field: false });
  const [returnDeadline, setReturnDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [emps, allAvailable] = await Promise.all([
        employeeService.getAll(),
        equipmentService.getByStatus('available'),
      ]);
      setEmployees(emps);
      setAvailableEquipments(allAvailable);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
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

    setLoading(true);
    try {
      const conditionNotes = selectedEquipments
        .map(id => {
          const eq = availableEquipments.find(e => e.id === id);
          const cond = equipmentConditions[id];
          return cond ? `${eq?.name}: ${cond}` : null;
        })
        .filter(Boolean)
        .join('; ');
      const finalNotes = [notes, conditionNotes].filter(Boolean).join(' | ');

      await allocationService.allocate(selectedEmployee, selectedEquipments, finalNotes, allocationDate.toISOString());
      toast.success('Onboarding realizado com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('Erro ao processar onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee('');
    setSelectedEquipments([]);
    setNotes('');
    setEquipmentConditions({});
    setMovementType('kit');
    setEnvironmentFilter({ station: false, field: false });
    setReturnDeadline(undefined);
    setAllocationDate(new Date());
    onOpenChange(false);
  };

  const filteredEquipments = availableEquipments.filter(eq => {
    if (environmentFilter.station && environmentFilter.field) return true;
    if (environmentFilter.station) return STATION_CATEGORIES.includes(eq.category);
    if (environmentFilter.field) return FIELD_CATEGORIES.includes(eq.category);
    return false;
  });

  const totalValue = filteredEquipments
    .filter(e => selectedEquipments.includes(e.id))
    .reduce((sum, e) => sum + (e.purchaseValue || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Onboarding - Entrega de Equipamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Employee Selection */}
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
                    <RadioGroupItem value="kit" id="modal-mov-kit" />
                    <Label htmlFor="modal-mov-kit" className="cursor-pointer text-sm font-medium">
                      Entrega de Kit
                      <span className="block text-xs text-muted-foreground font-normal">Novo colaborador</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex-1"
                    onClick={() => setMovementType('avulsa')}>
                    <RadioGroupItem value="avulsa" id="modal-mov-avulsa" />
                    <Label htmlFor="modal-mov-avulsa" className="cursor-pointer text-sm font-medium">
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Alocação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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

              {/* Equipment List */}
              <div className="space-y-2">
                <Label>Equipamentos Disponíveis</Label>
                <div className="max-h-[200px] overflow-y-auto border rounded-xl p-2 space-y-2">
                  {filteredEquipments.length > 0 ? (
                    filteredEquipments.map(eq => (
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
                        {selectedEquipments.includes(eq.id) && (
                          <div className="pl-10 pr-3 pb-2">
                            <Input
                              placeholder="Estado de entrega (ex: Notebook com detalhe na carcaça)"
                              value={equipmentConditions[eq.id] || ''}
                              onChange={e =>
                                setEquipmentConditions(prev => ({
                                  ...prev,
                                  [eq.id]: e.target.value,
                                }))
                              }
                              className="text-xs h-8"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Package className="w-8 h-8 mb-2" />
                      <p className="text-sm">
                        {!environmentFilter.station && !environmentFilter.field
                          ? 'Selecione ao menos um ambiente'
                          : 'Nenhum equipamento disponível'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Summary */}
              {selectedEquipments.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm text-muted-foreground">
                    {selectedEquipments.length} item(s) selecionado(s)
                  </span>
                  <span className="font-semibold text-primary">
                    R$ {totalValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Kit inicial de trabalho"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleOnboarding} 
                  disabled={loading || !selectedEmployee || selectedEquipments.length === 0}
                >
                  {loading ? 'Processando...' : 'Confirmar Entrega'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
