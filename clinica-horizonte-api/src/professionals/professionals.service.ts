import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AppointmentStatus } from '@prisma/client';

export interface TimeSlot {
  startTime: string; // ISO String
  endTime: string;   // ISO String
  displayTime: string; // "09:00 - 09:20"
  isAvailable: boolean;
}

const FALLBACK_PROFESSIONALS = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    licenseNumber: 'MED-CL-48201',
    firstName: 'Roberto',
    lastName: 'Morales Soto',
    email: 'dr.morales@clinicahorizonte.cl',
    phone: '+56 9 7654 3210',
    isActive: true,
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111101',
          code: 'MED-GEN',
          name: 'Medicina General',
          defaultDurationMin: 20,
        },
      },
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111103',
          code: 'CAR-01',
          name: 'Cardiología Preventiva',
          defaultDurationMin: 30,
        },
      },
    ],
    schedules: [
      { id: 's1', dayOfWeek: 1, startTime: '08:00', endTime: '14:00', boxNumber: 'Box 01', isActive: true, slotDurationMinutes: 20 },
      { id: 's2', dayOfWeek: 2, startTime: '08:00', endTime: '14:00', boxNumber: 'Box 01', isActive: true, slotDurationMinutes: 20 },
      { id: 's3', dayOfWeek: 3, startTime: '08:00', endTime: '14:00', boxNumber: 'Box 01', isActive: true, slotDurationMinutes: 20 },
      { id: 's4', dayOfWeek: 4, startTime: '08:00', endTime: '14:00', boxNumber: 'Box 01', isActive: true, slotDurationMinutes: 20 },
      { id: 's5', dayOfWeek: 5, startTime: '08:00', endTime: '14:00', boxNumber: 'Box 01', isActive: true, slotDurationMinutes: 20 },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    licenseNumber: 'MED-CL-59104',
    firstName: 'Carolina',
    lastName: 'Valenzuela Ríos',
    email: 'dra.valenzuela@clinicahorizonte.cl',
    phone: '+56 9 8765 4321',
    isActive: true,
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111102',
          code: 'PED-01',
          name: 'Pediatría Integral',
          defaultDurationMin: 30,
        },
      },
    ],
    schedules: [
      { id: 's6', dayOfWeek: 1, startTime: '09:00', endTime: '15:00', boxNumber: 'Box 03', isActive: true, slotDurationMinutes: 30 },
      { id: 's7', dayOfWeek: 2, startTime: '09:00', endTime: '15:00', boxNumber: 'Box 03', isActive: true, slotDurationMinutes: 30 },
      { id: 's8', dayOfWeek: 3, startTime: '09:00', endTime: '15:00', boxNumber: 'Box 03', isActive: true, slotDurationMinutes: 30 },
      { id: 's9', dayOfWeek: 4, startTime: '09:00', endTime: '15:00', boxNumber: 'Box 03', isActive: true, slotDurationMinutes: 30 },
      { id: 's10', dayOfWeek: 5, startTime: '09:00', endTime: '15:00', boxNumber: 'Box 03', isActive: true, slotDurationMinutes: 30 },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    licenseNumber: 'MED-CL-63209',
    firstName: 'Matías',
    lastName: 'Albornoz Tapia',
    email: 'dr.albornoz@clinicahorizonte.cl',
    phone: '+56 9 9876 5432',
    isActive: true,
    specialties: [
      {
        specialty: {
          id: '11111111-1111-1111-1111-111111111104',
          code: 'TRA-01',
          name: 'Traumatología',
          defaultDurationMin: 20,
        },
      },
    ],
    schedules: [
      { id: 's11', dayOfWeek: 1, startTime: '14:00', endTime: '20:00', boxNumber: 'Box 04', isActive: true, slotDurationMinutes: 20 },
      { id: 's12', dayOfWeek: 3, startTime: '14:00', endTime: '20:00', boxNumber: 'Box 04', isActive: true, slotDurationMinutes: 20 },
      { id: 's13', dayOfWeek: 5, startTime: '14:00', endTime: '20:00', boxNumber: 'Box 04', isActive: true, slotDurationMinutes: 20 },
    ],
  },
];

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const items = await this.prisma.professional.findMany({
        where: { isActive: true },
        include: {
          specialties: {
            include: { specialty: true },
          },
          schedules: {
            where: { isActive: true },
          },
        },
        orderBy: { lastName: 'asc' },
      });
      if (items && items.length > 0) return items;
      return FALLBACK_PROFESSIONALS;
    } catch {
      return FALLBACK_PROFESSIONALS;
    }
  }

  async findById(id: string) {
    try {
      const professional = await this.prisma.professional.findUnique({
        where: { id },
        include: {
          specialties: {
            include: { specialty: true },
          },
          schedules: {
            where: { isActive: true },
          },
        },
      });
      if (professional) return professional;
    } catch {
      // Fallback
    }

    const found = FALLBACK_PROFESSIONALS.find((p) => p.id === id);
    if (!found) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        message: 'El profesional de salud solicitado no existe.',
      });
    }

    return found;
  }

  async getAvailability(professionalId: string, query: AvailabilityQueryDto) {
    const professional = await this.findById(professionalId);

    // Parsear fecha en hora local
    const [year, month, day] = query.date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay();

    // Obtener configuración de horario para el día
    const schedule = professional.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule) {
      return {
        professionalId,
        date: query.date,
        dayOfWeek,
        hasSchedule: false,
        message: 'El profesional no atiende en el día seleccionado.',
        slots: [],
      };
    }

    // Calcular inicio y fin del día para citas
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    // Citas existentes no canceladas
    let existingAppointments: any[] = [];
    try {
      existingAppointments = await this.prisma.appointment.findMany({
        where: {
          professionalId,
          startTime: { gte: dayStart, lte: dayEnd },
          status: {
            notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
          },
        },
      });
    } catch {
      existingAppointments = [];
    }

    // Generar franjas horarias
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const duration = schedule.slotDurationMinutes || 20;

    const slots: TimeSlot[] = [];
    let currentSlotStart = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
    const scheduleEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin));

    while (currentSlotStart < scheduleEnd) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + duration * 60000);
      if (currentSlotEnd > scheduleEnd) break;

      // Verificar solapamiento con citas existentes
      const hasConflict = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.startTime).getTime();
        const apptEnd = new Date(appt.endTime).getTime();
        const slotStart = currentSlotStart.getTime();
        const slotEnd = currentSlotEnd.getTime();

        return !(slotEnd <= apptStart || slotStart >= apptEnd);
      });

      const pad = (n: number) => n.toString().padStart(2, '0');
      const displayStart = `${pad(currentSlotStart.getUTCHours())}:${pad(currentSlotStart.getUTCMinutes())}`;
      const displayEnd = `${pad(currentSlotEnd.getUTCHours())}:${pad(currentSlotEnd.getUTCMinutes())}`;

      slots.push({
        startTime: currentSlotStart.toISOString(),
        endTime: currentSlotEnd.toISOString(),
        displayTime: `${displayStart} - ${displayEnd}`,
        isAvailable: !hasConflict,
      });

      currentSlotStart = currentSlotEnd;
    }

    return {
      professionalId,
      date: query.date,
      dayOfWeek,
      hasSchedule: true,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.isAvailable).length,
      slots,
    };
  }
}
