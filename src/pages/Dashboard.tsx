import { useEffect, useState } from "react";
import { Users, DollarSign, Package, AlertTriangle, UserPlus, UserMinus } from "lucide-react";
import { equipmentService } from "@/services/equipmentService";
import { employeeService } from "@/services/employeeService";
import { allocationService } from "@/services/allocationService";
import { AllocationWithDetails, OverdueReturn } from "@/types";
import { Button } from "@/components/ui/button";
import { OffboardingModal } from "@/components/OffboardingModal";
import { OnboardingModal } from "@/components/OnboardingModal";

// Dados fictícios de pendências
const mockOverdueReturns: OverdueReturn[] = [
  {
    id: "1",
    employeeId: "4",
    employeeName: "Rafael Oliveira",
    equipmentName: 'MacBook Pro 14"',
    dueDate: "2026-01-20",
    daysOverdue: 17,
    resolved: false,
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Carlos Mendes",
    equipmentName: "Monitor LG UltraWide",
    dueDate: "2026-01-28",
    daysOverdue: 9,
    resolved: false,
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Beatriz Costa",
    equipmentName: "iPhone 15 Pro",
    dueDate: "2026-02-01",
    daysOverdue: 5,
    resolved: false,
  },
];

interface Stats {
  totalEquipments: number;
  totalValue: number;
  available: number;
  allocated: number;
  maintenance: number;
  totalEmployees: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEquipments: 0,
    totalValue: 0,
    available: 0,
    allocated: 0,
    maintenance: 0,
    totalEmployees: 0,
  });
  const [recentAllocations, setRecentAllocations] = useState<AllocationWithDetails[]>([]);
  const [overdueReturns, setOverdueReturns] = useState<OverdueReturn[]>(mockOverdueReturns);
  const [loading, setLoading] = useState(true);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [offboardingModal, setOffboardingModal] = useState<{
    open: boolean;
    employeeId: string;
    employeeName: string;
  }>({ open: false, employeeId: "", employeeName: "" });

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenOffboardingModal = (item: OverdueReturn) => {
    setOffboardingModal({
      open: true,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
    });
  };

  const handleOffboardingSuccess = () => {
    setOverdueReturns((prev) =>
      prev.map((item) => (item.employeeId === offboardingModal.employeeId ? { ...item, resolved: true } : item)),
    );
    loadData();
  };

  const loadData = async () => {
    const equipmentStats = await equipmentService.getStats();
    const employees = await employeeService.getAll();
    const allocations = await allocationService.getAllWithDetails();

    setStats({
      totalEquipments: equipmentStats.total,
      totalValue: equipmentStats.totalValue,
      available: equipmentStats.available,
      allocated: equipmentStats.allocated,
      maintenance: equipmentStats.maintenance,
      totalEmployees: employees.length,
    });

    setRecentAllocations(allocations.slice(-5).reverse());
    setLoading(false);
  };

  const pendingOverdueCount = overdueReturns.filter((item) => !item.resolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do inventário</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setOnboardingOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Onboarding
          </Button>
          <Button
            onClick={() => setOffboardingModal({ open: true, employeeId: "", employeeName: "" })}
            variant="outline"
            className="gap-2"
          >
            <UserMinus className="w-4 h-4" />
            Offboarding
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Equipamentos</p>
              <p className="text-3xl font-semibold text-foreground mt-1">{stats.totalEquipments}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-3xl font-semibold text-foreground mt-1">
                R$ {stats.totalValue.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Colaboradores</p>
              <p className="text-3xl font-semibold text-foreground mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Invertida: Status Overview primeiro, Pendências depois */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Overview (Agora à esquerda no desktop) */}
        <div className="card-minimal">
          <h2 className="text-base font-semibold text-foreground mb-6">Status dos Equipamentos</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-muted-foreground">Disponível</span>
              </div>
              <span className="font-medium text-foreground">{stats.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Alocado</span>
              </div>
              <span className="font-medium text-foreground">{stats.allocated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-muted-foreground">Manutenção</span>
              </div>
              <span className="font-medium text-foreground">{stats.maintenance}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-3 sm:h-2 rounded-full overflow-hidden flex bg-muted/30">
              {stats.totalEquipments > 0 ? (
                <>
                  <div
                    className="bg-emerald-500 transition-all duration-300 min-w-[4px]"
                    style={{ width: `${(stats.available / stats.totalEquipments) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 transition-all duration-300 min-w-[4px]"
                    style={{ width: `${(stats.allocated / stats.totalEquipments) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-300 min-w-[4px]"
                    style={{ width: `${(stats.maintenance / stats.totalEquipments) * 100}%` }}
                  />
                </>
              ) : (
                <div className="w-full bg-muted/50" />
              )}
            </div>
          </div>
        </div>

        {/* Overdue Returns Alert (Agora à direita no desktop) */}
        <div className="card-minimal border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Pendências de Devolução</h2>
              <p className="text-sm text-muted-foreground">
                {pendingOverdueCount} {pendingOverdueCount === 1 ? "pessoa" : "pessoas"} com equipamentos fora do prazo
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {overdueReturns.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  item.resolved ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.resolved ? "bg-emerald-100" : "bg-amber-100"
                    }`}
                  >
                    <span className={`text-sm font-medium ${item.resolved ? "text-emerald-700" : "text-amber-700"}`}>
                      {item.employeeName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        item.resolved ? "text-emerald-700 line-through" : "text-foreground"
                      }`}
                    >
                      {item.employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.equipmentName} • {item.daysOverdue} dias em atraso
                    </p>
                  </div>
                </div>

                {!item.resolved ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenOffboardingModal(item)}
                    className="gap-1.5 text-xs border-amber-300 hover:bg-amber-100"
                  >
                    <UserMinus className="w-3 h-3" />
                    Resolver
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-100 rounded-full">
                    Resolvido
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Allocations */}
      <div className="card-minimal">
        <h2 className="text-base font-semibold text-foreground mb-6">Últimas Alocações</h2>
        {recentAllocations.length > 0 ? (
          <div className="space-y-3">
            {recentAllocations.map((allocation) => (
              <div
                key={allocation.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">{allocation.employee.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{allocation.employee.name}</p>
                    <p className="text-sm text-muted-foreground">{allocation.equipment.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(allocation.allocatedAt).toLocaleDateString("pt-BR")}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      allocation.returnedAt
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {allocation.returnedAt ? "Devolvido" : "Alocado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma alocação registrada</p>
        )}
      </div>

      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} onSuccess={loadData} />

      <OffboardingModal
        open={offboardingModal.open}
        onOpenChange={(open) => setOffboardingModal((prev) => ({ ...prev, open }))}
        employeeId={offboardingModal.employeeId}
        employeeName={offboardingModal.employeeName}
        onSuccess={handleOffboardingSuccess}
      />
    </div>
  );
}
