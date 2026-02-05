import { useEffect, useState } from 'react';
import { 
  Monitor, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { equipmentService } from '@/services/equipmentService';
import { employeeService } from '@/services/employeeService';
import { allocationService } from '@/services/allocationService';
import { AllocationWithDetails } from '@/types';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadData();
  }, []);

  const allocatedPercentage = stats.totalEquipments > 0 
    ? Math.round((stats.allocated / stats.totalEquipments) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do inventário de equipamentos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground/60">Total de Ativos</p>
              <p className="text-3xl font-bold text-card-foreground">{stats.totalEquipments}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground/60">Valor Total</p>
              <p className="text-3xl font-bold text-card-foreground">
                R$ {stats.totalValue.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground/60">Colaboradores</p>
              <p className="text-3xl font-bold text-card-foreground">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-card-foreground/60">Taxa de Alocação</p>
              <p className="text-3xl font-bold text-card-foreground">{allocatedPercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-dark">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Status dos Equipamentos</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-available"></div>
                <span className="text-card-foreground/80">Disponível</span>
              </div>
              <span className="font-semibold text-card-foreground">{stats.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-allocated"></div>
                <span className="text-card-foreground/80">Alocado</span>
              </div>
              <span className="font-semibold text-card-foreground">{stats.allocated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-maintenance"></div>
                <span className="text-card-foreground/80">Manutenção</span>
              </div>
              <span className="font-semibold text-card-foreground">{stats.maintenance}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-3 rounded-full bg-card-foreground/10 overflow-hidden flex">
              <div 
                className="bg-status-available transition-all"
                style={{ width: `${(stats.available / stats.totalEquipments) * 100}%` }}
              />
              <div 
                className="bg-status-allocated transition-all"
                style={{ width: `${(stats.allocated / stats.totalEquipments) * 100}%` }}
              />
              <div 
                className="bg-status-maintenance transition-all"
                style={{ width: `${(stats.maintenance / stats.totalEquipments) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card-dark">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Alertas</h2>
          <div className="space-y-3">
            {stats.maintenance > 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-status-maintenance/20">
                <AlertTriangle className="w-5 h-5 text-status-maintenance" />
                <span className="text-card-foreground">
                  {stats.maintenance} equipamento(s) em manutenção
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-status-available/20">
                <CheckCircle className="w-5 h-5 text-status-available" />
                <span className="text-card-foreground">
                  Nenhum equipamento em manutenção
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Allocations */}
      <div className="card-dark">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Últimas Alocações</h2>
        {recentAllocations.length > 0 ? (
          <div className="space-y-3">
            {recentAllocations.map((allocation) => (
              <div 
                key={allocation.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card-foreground/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {allocation.employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{allocation.employee.name}</p>
                    <p className="text-sm text-card-foreground/60">{allocation.equipment.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-card-foreground/60">
                    {new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    allocation.returnedAt 
                      ? 'bg-status-available/20 text-status-available' 
                      : 'bg-status-allocated/20 text-status-allocated'
                  }`}>
                    {allocation.returnedAt ? 'Devolvido' : 'Ativo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-card-foreground/60 text-center py-8">Nenhuma alocação registrada</p>
        )}
      </div>
    </div>
  );
}
