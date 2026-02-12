import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Employee, AllocationWithDetails } from "@/types";
import { allocationService } from "@/services/allocationService";
import { Building2, Smartphone, History, FileCheck, ArrowDown, ArrowUp, CheckCircle2, AlertCircle } from "lucide-react";

interface EmployeeDetailDialogProps {
  employee: Employee | null;
  onClose: () => void;
}

export default function EmployeeDetailDialog({ employee, onClose }: EmployeeDetailDialogProps) {
  const [allAllocations, setAllAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setLoading(true);
      allocationService.getByEmployee(employee.id).then((data) => {
        setAllAllocations(data);
        setLoading(false);
      });
    }
  }, [employee]);

  if (!employee) return null;

  const activeStation = allAllocations.filter((a) => !a.returnedAt && a.equipment?.classification === "station");
  const activeField = allAllocations.filter((a) => !a.returnedAt && a.equipment?.classification === "field");
  const history = [...allAllocations].sort(
    (a, b) => new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime()
  );

  const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");

  return (
    <Dialog open={!!employee} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">{employee.name.charAt(0)}</span>
            </div>
            <div>
              <p>{employee.name}</p>
              <p className="text-sm font-normal text-muted-foreground">{employee.role} · {employee.department}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="setup" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="setup" className="gap-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="externas" className="gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5" />
                Externas
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-1.5 text-xs">
                <History className="w-3.5 h-3.5" />
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* Setup de Mesa */}
            <TabsContent value="setup" className="space-y-3">
              {activeStation.length > 0 ? (
                activeStation.map((allocation) => (
                  <div key={allocation.id} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                    <div>
                      <p className="font-medium">{allocation.equipment.name}</p>
                      <p className="text-sm text-muted-foreground">{allocation.equipment.serialNumber}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Desde {formatDate(allocation.allocatedAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum equipamento de setup de mesa alocado</p>
              )}
            </TabsContent>

            {/* Externas */}
            <TabsContent value="externas" className="space-y-3">
              {activeField.length > 0 ? (
                activeField.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <div>
                      <p className="font-medium">{allocation.equipment.name}</p>
                      <p className="text-sm text-muted-foreground">{allocation.equipment.serialNumber}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Desde {formatDate(allocation.allocatedAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum equipamento de externas alocado</p>
              )}
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="historico" className="space-y-3">
              {history.length > 0 ? (
                history.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-full ${allocation.returnedAt ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                      {allocation.returnedAt ? (
                        <ArrowUp className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{allocation.equipment.name}</p>
                        <Badge variant={allocation.returnedAt ? "outline" : "default"} className="text-[10px] px-1.5 py-0">
                          {allocation.returnedAt ? "Devolvido" : "Em uso"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{allocation.equipment.serialNumber}</p>
                      {allocation.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{allocation.notes}"</p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>Recebido: {formatDate(allocation.allocatedAt)}</span>
                        {allocation.returnedAt && <span>Devolvido: {formatDate(allocation.returnedAt)}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de alocação</p>
              )}
            </TabsContent>

            {/* Termo de Responsabilidade - Oculto/Desativado */}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
