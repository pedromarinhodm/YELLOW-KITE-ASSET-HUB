import { useEffect, useState } from 'react';
import { CalendarPlus, Search, CalendarIcon, X, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { employeeService } from '@/services/employeeService';
import { equipmentService } from '@/services/equipmentService';
import { reservationService } from '@/services/reservationService';
import { Employee, Equipment, ReservationWithDetails, RESERVATION_STATUS_LABELS } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { toast } from 'sonner';

export default function Reservations() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fieldEquipments, setFieldEquipments] = useState<Equipment[]>([]);
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New reservation state
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reservationNotes, setReservationNotes] = useState('');

  // Return dialog
  const [returnReservationId, setReturnReservationId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [emps, allReservations] = await Promise.all([
      employeeService.getAll(),
      reservationService.getAllWithDetails(),
    ]);

    setEmployees(emps);
    setReservations(allReservations);
    setLoading(false);
  };

  const loadFieldEquipments = async () => {
    const equipments = await equipmentService.getAvailableByClassification('field');
    setFieldEquipments(equipments);
  };

  const handleOpenNewReservation = async () => {
    await loadFieldEquipments();
    setSelectedEmployee('');
    setSelectedEquipment('');
    setStartDate(undefined);
    setEndDate(undefined);
    setReservationNotes('');
    setIsNewReservationOpen(true);
  };

  const handleCreateReservation = async () => {
    if (!selectedEmployee || !selectedEquipment || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (endDate < startDate) {
      toast.error('Data de devolução deve ser após a data de retirada');
      return;
    }

    const isAvailable = await reservationService.isEquipmentAvailable(
      selectedEquipment,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (!isAvailable) {
      toast.error('Este equipamento já está reservado neste período');
      return;
    }

    await reservationService.create({
      employeeId: selectedEmployee,
      equipmentId: selectedEquipment,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      notes: reservationNotes,
    });

    toast.success('Reserva criada com sucesso!');
    setIsNewReservationOpen(false);
    await loadData();
  };

  const handlePickup = async (reservationId: string) => {
    await reservationService.pickup(reservationId);
    toast.success('Retirada confirmada!');
    await loadData();
  };

  const handleReturn = async () => {
    if (!returnReservationId) return;

    await reservationService.return(returnReservationId, returnNotes);
    toast.success('Devolução registrada!');
    setReturnReservationId(null);
    setReturnNotes('');
    await loadData();
  };

  const handleCancel = async (reservationId: string) => {
    const success = await reservationService.cancel(reservationId);
    if (success) {
      toast.success('Reserva cancelada!');
      await loadData();
    } else {
      toast.error('Não foi possível cancelar esta reserva');
    }
  };

  const getStatusBadge = (reservation: ReservationWithDetails) => {
    const isOverdue = reservation.status === 'overdue' || 
      (reservation.status === 'active' && isPast(new Date(reservation.endDate)));
    
    if (isOverdue) {
      const daysOverdue = differenceInDays(new Date(), new Date(reservation.endDate));
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="w-3 h-3" />
          Atrasado {daysOverdue}d
        </span>
      );
    }

    const statusColors: Record<string, string> = {
      pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      active: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      returned: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    };

    return (
      <span className={cn(
        'inline-flex items-center text-xs px-2 py-1 rounded-full border',
        statusColors[reservation.status] || 'bg-muted text-muted-foreground'
      )}>
        {RESERVATION_STATUS_LABELS[reservation.status]}
      </span>
    );
  };

  const filteredReservations = reservations
    .filter(r => {
      if (statusFilter === 'active') return r.status === 'active' || r.status === 'pending' || r.status === 'overdue';
      if (statusFilter === 'returned') return r.status === 'returned';
      if (statusFilter === 'overdue') return r.status === 'overdue';
      return true;
    })
    .filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.employee.name.toLowerCase().includes(term) ||
        r.equipment.name.toLowerCase().includes(term) ||
        r.equipment.serialNumber.toLowerCase().includes(term)
      );
    });

  // Stats
  const overdueCount = reservations.filter(r => 
    r.status === 'overdue' || (r.status === 'active' && isPast(new Date(r.endDate)))
  ).length;
  const activeCount = reservations.filter(r => r.status === 'active' || r.status === 'pending').length;

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
          <h1 className="text-2xl font-semibold text-foreground">Reservas</h1>
          <p className="text-muted-foreground">Equipamentos de campo - Check-out e devolução</p>
        </div>

        <Button onClick={handleOpenNewReservation} className="gap-2">
          <CalendarPlus className="w-4 h-4" />
          Nova Reserva
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-minimal">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reservas Ativas</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </div>
        </div>
        {overdueCount > 0 && (
          <div className="card-minimal border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-destructive">Devoluções Atrasadas</p>
                <p className="text-xl font-semibold text-destructive">{overdueCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador ou equipamento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas/Agendadas</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
            <SelectItem value="returned">Devolvidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reservations List */}
      <div className="grid gap-3">
        {filteredReservations.length > 0 ? (
          filteredReservations.map(reservation => (
            <div key={reservation.id} className={cn(
              "card-minimal",
              reservation.status === 'returned' && "opacity-70",
              (reservation.status === 'overdue' || (reservation.status === 'active' && isPast(new Date(reservation.endDate)))) && "border-destructive/30 bg-destructive/5"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {reservation.employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{reservation.employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{reservation.employee.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <CategoryIcon category={reservation.equipment.category} className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{reservation.equipment.name}</p>
                    <p className="text-xs text-muted-foreground">{reservation.equipment.serialNumber}</p>
                  </div>
                </div>

                <div className="text-sm text-right flex-shrink-0">
                  <p className="text-muted-foreground">
                    {format(new Date(reservation.startDate), "dd/MM", { locale: ptBR })} → {format(new Date(reservation.endDate), "dd/MM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {differenceInDays(new Date(reservation.endDate), new Date(reservation.startDate)) + 1} dias
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(reservation)}
                  
                  {reservation.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handlePickup(reservation.id)}>
                        Confirmar Retirada
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCancel(reservation.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {(reservation.status === 'active' || reservation.status === 'overdue') && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setReturnReservationId(reservation.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Devolver
                    </Button>
                  )}
                </div>
              </div>
              
              {reservation.notes && (
                <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                  {reservation.notes}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="card-minimal text-center py-12">
            <p className="text-muted-foreground">Nenhuma reserva encontrada</p>
          </div>
        )}
      </div>

      {/* New Reservation Dialog */}
      <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Reserva de Equipamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
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
              <Label>Equipamento</Label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {fieldEquipments.length > 0 ? (
                    fieldEquipments.map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={eq.category} className="w-4 h-4" />
                          {eq.name} ({eq.serialNumber})
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum equipamento de campo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Retirada</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Devolução</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ptBR}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={reservationNotes}
                onChange={e => setReservationNotes(e.target.value)}
                placeholder="Ex: Gravação evento corporativo"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateReservation}
                disabled={!selectedEmployee || !selectedEquipment || !startDate || !endDate}
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={!!returnReservationId} onOpenChange={() => setReturnReservationId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                placeholder="Ex: Equipamento em bom estado"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReturnReservationId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleReturn}>
                Confirmar Devolução
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
