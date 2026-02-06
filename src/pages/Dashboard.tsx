import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  UserPlus,
  UserMinus,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { equipmentService } from '@/services/equipmentService';
import { employeeService } from '@/services/employeeService';
import { allocationService } from '@/services/allocationService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { OnboardingModal } from '@/components/OnboardingModal';
import { OffboardingModal } from '@/components/OffboardingModal';

interface PendingReturn {
  id: string;
  employeeId: string;
  employeeName: string;
  equipmentName: string;
  allocatedAt: string;
  daysAllocated: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    allocated: 0,
    maintenance: 0,
    totalValue: 0,
  });
  const [employeesCount, setEmployeesCount] = useState(0);
  const [pendingReturns, setPendingReturns] = useState<PendingReturn[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [offboardingModal, setOffboardingModal] = useState({
    open: false,
    employeeId: '',
    employeeName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equipStats, employees, allocations] = await Promise.all([
        equipmentService.getStats(),
        employeeService.getAll(),
        allocationService.getAllWithDetails(),
      ]);

      setStats(equipStats);
      setEmployeesCount(employees.length);

      // Calculate pending returns (allocations older than 30 days without return)
      const pending: PendingReturn[] = allocations
        .filter(a => !a.returnedAt)
        .map(a => {
          const allocatedDate = new Date(a.allocatedAt);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - allocatedDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            id: a.id,
            employeeId: a.employeeId,
            employeeName: a.employee?.name || 'Colaborador',
            equipmentName: a.equipment?.name || 'Equipamento',
            allocatedAt: a.allocatedAt,
            daysAllocated: diffDays,
          };
        })
        .filter(p => p.daysAllocated > 30);

      setPendingReturns(pending);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOffboardingModal = (employeeId: string, employeeName: string) => {
    setOffboardingModal({
      open: true,
      employeeId,
      employeeName,
    });
  };

  const handleOffboardingSuccess = () => {
    loadData();
  };

  const handleOnboardingSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu inventário de equipamentos
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button 
          className="gap-2"
          onClick={() => setOnboardingOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Onboarding
        </Button>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => setOffboardingModal({ open: true, employeeId: '', employeeName: '' })}
        >
          <UserMinus className="w-4 h-4" />
          Offboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Equipamentos
            </CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {stats.totalValue.toLocaleString('pt-BR')} em patrimônio
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponíveis
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prontos para alocação
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alocados
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.allocated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em uso por colaboradores
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colaboradores
            </CardTitle>
            <Users className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{employeesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Returns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pendências de Devolução
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReturns.length > 0 ? (
            <div className="space-y-3">
              {pendingReturns.map(pending => (
                <div
                  key={pending.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <CategoryIcon category="notebook" className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{pending.equipmentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {pending.employeeName} • {pending.daysAllocated} dias
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleOpenOffboardingModal(pending.employeeId, pending.employeeName)}
                  >
                    Resolver <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
              <p className="font-medium">Nenhuma pendência</p>
              <p className="text-sm">Todas as devoluções estão em dia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Offboarding Modal */}
      <OffboardingModal
        open={offboardingModal.open}
        onOpenChange={(open) => setOffboardingModal(prev => ({ ...prev, open }))}
        employeeId={offboardingModal.employeeId}
        employeeName={offboardingModal.employeeName}
        onSuccess={handleOffboardingSuccess}
      />
    </div>
  );
};

export default Dashboard;
