import { useEffect, useState } from 'react';
import { 
  Users, 
  DollarSign,
  TrendingUp,
  Package
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do inventário</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Ativos</p>
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
                R$ {stats.totalValue.toLocaleString('pt-BR')}
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

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Alocação</p>
              <p className="text-3xl font-semibold text-foreground mt-1">{allocatedPercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
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

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <div 
              className="bg-emerald-500 transition-all"
              style={{ width: `${(stats.available / stats.totalEquipments) * 100}%` }}
            />
            <div 
              className="bg-blue-500 transition-all"
              style={{ width: `${(stats.allocated / stats.totalEquipments) * 100}%` }}
            />
            <div 
              className="bg-amber-500 transition-all"
              style={{ width: `${(stats.maintenance / stats.totalEquipments) * 100}%` }}
            />
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
                    <span className="text-primary font-medium">
                      {allocation.employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{allocation.employee.name}</p>
                    <p className="text-sm text-muted-foreground">{allocation.equipment.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(allocation.allocatedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    allocation.returnedAt 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {allocation.returnedAt ? 'Devolvido' : 'Ativo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma alocação registrada</p>
        )}
      </div>
    </div>
  );
}
