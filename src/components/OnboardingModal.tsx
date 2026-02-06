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
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { employeeService } from '@/services/employeeService';
import { equipmentService } from '@/services/equipmentService';
import { allocationService } from '@/services/allocationService';
import { Employee, Equipment } from '@/types';
import { toast } from 'sonner';
import { UserPlus, Package } from 'lucide-react';

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
      // Only load station equipment for allocations (fixed assignments)
      const stationEquipments = allAvailable.filter(e => e.classification === 'station');
      setEmployees(emps);
      setAvailableEquipments(stationEquipments);
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
      await allocationService.allocate(selectedEmployee, selectedEquipments, notes);
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
    onOpenChange(false);
  };

  const totalValue = availableEquipments
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

              {/* Equipment List */}
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
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Package className="w-8 h-8 mb-2" />
                      <p className="text-sm">Nenhum equipamento disponível</p>
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
