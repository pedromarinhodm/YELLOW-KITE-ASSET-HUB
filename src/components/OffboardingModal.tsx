import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { allocationService } from '@/services/allocationService';
import { AllocationWithDetails } from '@/types';
import { toast } from 'sonner';
import { UserMinus, Package } from 'lucide-react';

interface OffboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
}

export function OffboardingModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSuccess,
}: OffboardingModalProps) {
  const [activeAllocations, setActiveAllocations] = useState<AllocationWithDetails[]>([]);
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  useEffect(() => {
    if (open && employeeId) {
      loadActiveAllocations();
    }
  }, [open, employeeId]);

  const loadActiveAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const actives = await allocationService.getActiveByEmployee(employeeId);
      setActiveAllocations(actives);
      // Pre-select all allocations
      setSelectedAllocations(actives.map(a => a.id));
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoadingAllocations(false);
    }
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
      for (const allocationId of selectedAllocations) {
        await allocationService.deallocate(allocationId, notes);
      }
      toast.success(`${selectedAllocations.length} equipamento(s) devolvido(s) com sucesso!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error during offboarding:', error);
      toast.error('Erro ao processar devolução');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAllocations([]);
    setNotes('');
    onOpenChange(false);
  };

  const totalValue = activeAllocations
    .filter(a => selectedAllocations.includes(a.id))
    .reduce((sum, a) => sum + (a.equipment?.purchaseValue || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="w-5 h-5" />
            Offboarding - Devolução
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Employee Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-lg">
                {employeeName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{employeeName}</p>
              <p className="text-sm text-muted-foreground">
                {activeAllocations.length} equipamento(s) alocado(s)
              </p>
            </div>
          </div>

          {/* Allocations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Equipamentos para Devolução</Label>
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
            
            <div className="max-h-[200px] overflow-y-auto border rounded-xl p-2 space-y-2">
              {loadingAllocations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                </div>
              ) : activeAllocations.length > 0 ? (
                activeAllocations.map(alloc => (
                  <div
                    key={alloc.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleToggleAllocation(alloc.id)}
                  >
                    <Checkbox checked={selectedAllocations.includes(alloc.id)} />
                    <CategoryIcon category={alloc.equipment.category} className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alloc.equipment.name}</p>
                      <p className="text-xs text-muted-foreground">{alloc.equipment.serialNumber}</p>
                    </div>
                    <span className="text-sm font-medium">
                      R$ {alloc.equipment.purchaseValue.toLocaleString('pt-BR')}
                    </span>
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

          {/* Selected Summary */}
          {selectedAllocations.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm text-muted-foreground">
                {selectedAllocations.length} item(s) selecionado(s)
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
              placeholder="Ex: Equipamentos devolvidos em bom estado"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleOffboarding} 
              disabled={loading || selectedAllocations.length === 0}
            >
              {loading ? 'Processando...' : 'Confirmar Devolução'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
