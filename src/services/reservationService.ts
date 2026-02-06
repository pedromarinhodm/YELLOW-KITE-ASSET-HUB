import { Reservation, ReservationWithDetails } from '@/types';
import { mockReservations } from '@/mock/db';
import { equipmentService } from './equipmentService';
import { employeeService } from './employeeService';

// In-memory storage (will be replaced with Supabase)
let reservations: Reservation[] = [...mockReservations];

export const reservationService = {
  getAll: async (): Promise<Reservation[]> => {
    return [...reservations];
  },

  getAllWithDetails: async (): Promise<ReservationWithDetails[]> => {
    const employees = await employeeService.getAll();
    const equipments = await equipmentService.getAll();

    // Check and update overdue reservations
    const now = new Date();
    reservations = reservations.map(r => {
      if (r.status === 'active' && new Date(r.endDate) < now && !r.returnedAt) {
        return { ...r, status: 'overdue' as const };
      }
      if (r.status === 'pending' && new Date(r.startDate) <= now && !r.pickedUpAt) {
        // Auto-start if past start date
        return { ...r, status: 'active' as const };
      }
      return r;
    });

    return reservations.map(reservation => ({
      ...reservation,
      employee: employees.find(e => e.id === reservation.employeeId)!,
      equipment: equipments.find(e => e.id === reservation.equipmentId)!,
    })).filter(r => r.employee && r.equipment);
  },

  getByEmployee: async (employeeId: string): Promise<ReservationWithDetails[]> => {
    const all = await reservationService.getAllWithDetails();
    return all.filter(r => r.employeeId === employeeId);
  },

  getActiveAndPending: async (): Promise<ReservationWithDetails[]> => {
    const all = await reservationService.getAllWithDetails();
    return all.filter(r => r.status === 'active' || r.status === 'pending' || r.status === 'overdue');
  },

  getOverdue: async (): Promise<ReservationWithDetails[]> => {
    const all = await reservationService.getAllWithDetails();
    return all.filter(r => r.status === 'overdue');
  },

  create: async (data: {
    employeeId: string;
    equipmentId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }): Promise<Reservation> => {
    const newReservation: Reservation = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    reservations.push(newReservation);

    // Update equipment status
    await equipmentService.update(data.equipmentId, { status: 'reserved' });

    return newReservation;
  },

  pickup: async (reservationId: string): Promise<Reservation | undefined> => {
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return undefined;

    reservations[index] = {
      ...reservations[index],
      pickedUpAt: new Date().toISOString(),
      status: 'active',
    };

    return reservations[index];
  },

  return: async (reservationId: string, notes?: string): Promise<Reservation | undefined> => {
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return undefined;

    reservations[index] = {
      ...reservations[index],
      returnedAt: new Date().toISOString(),
      status: 'returned',
      notes: notes || reservations[index].notes,
    };

    // Update equipment status back to available
    await equipmentService.update(reservations[index].equipmentId, { status: 'available' });

    return reservations[index];
  },

  cancel: async (reservationId: string): Promise<boolean> => {
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return false;

    const reservation = reservations[index];
    
    // Only allow canceling pending reservations
    if (reservation.status !== 'pending') return false;

    // Update equipment status back to available
    await equipmentService.update(reservation.equipmentId, { status: 'available' });

    reservations.splice(index, 1);
    return true;
  },

  isEquipmentAvailable: async (equipmentId: string, startDate: string, endDate: string): Promise<boolean> => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflicting = reservations.find(r => 
      r.equipmentId === equipmentId &&
      r.status !== 'returned' &&
      // Check for overlap
      new Date(r.startDate) < end &&
      new Date(r.endDate) > start
    );

    return !conflicting;
  },
};
