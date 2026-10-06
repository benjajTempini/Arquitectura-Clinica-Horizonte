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

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.professional.findMany({
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
  }

  async findById(id: string) {
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

    if (!professional) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        message: 'El profesional de salud solicitado no existe.',
      });
    }

    return professional;
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
