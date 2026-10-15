import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { AppointmentStatus, AuditAction, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface TimeSlot {
  startTime: string; // ISO String
  endTime: string;   // ISO String
  displayTime: string; // "09:00 - 09:20"
  isAvailable: boolean;
}

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.professional.findMany({
      where: includeInactive ? {} : { isActive: true },
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

  async create(dto: CreateProfessionalDto, adminUserId?: string) {
    const { licenseNumber, firstName, lastName, email, phone, specialtyId, box, password } = dto;
    const cleanEmail = email.trim().toLowerCase();
    const cleanLicense = licenseNumber.trim().toUpperCase();

    // 1. Validar registro de superintendencia
    const existingByLicense = await this.prisma.professional.findUnique({
      where: { licenseNumber: cleanLicense },
    });
    if (existingByLicense) {
      throw new ConflictException({
        code: 'LICENSE_ALREADY_EXISTS',
        message: `El registro de la Superintendencia de Salud ${cleanLicense} ya está registrado.`,
      });
    }

    // 2. Validar correo corporativo
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingByEmail) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'El correo electrónico corporativo ya está registrado.',
      });
    }

    // 3. Validar especialidad
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: specialtyId },
    });
    if (!specialty) {
      throw new NotFoundException({
        code: 'SPECIALTY_NOT_FOUND',
        message: 'La especialidad médica seleccionada no existe.',
      });
    }

    // 4. Asegurar rol DOCTOR
    let doctorRole = await this.prisma.role.findUnique({
      where: { name: RoleName.DOCTOR },
    });
    if (!doctorRole) {
      doctorRole = await this.prisma.role.create({
        data: {
          name: RoleName.DOCTOR,
          description: 'Médico tratante con acceso a agenda e historial clínico autorizado',
        },
      });
    }

    // 5. Encriptar contraseña inicial
    const initialPassword = password || 'Clinica2026!';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 6. Transacción atómica
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isActive: true,
          userRoles: {
            create: {
              roleId: doctorRole.id,
            },
          },
        },
      });

      const professional = await tx.professional.create({
        data: {
          licenseNumber: cleanLicense,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          isActive: true,
          userId: user.id,
          specialties: {
            create: {
              specialtyId: specialty.id,
            },
          },
          schedules: {
            create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
              dayOfWeek,
              startTime: '08:40',
              endTime: '17:40',
              slotDurationMinutes: specialty.durationMinutes || 20,
              isActive: true,
            })),
          },
        },
        include: {
          specialties: { include: { specialty: true } },
          schedules: true,
        },
      });

      return professional;
    });

    // 7. Registro en auditoría sanitaria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'PROFESSIONAL',
      resourceId: created.id,
      userId: adminUserId,
      details: {
        licenseNumber: created.licenseNumber,
        name: `${created.firstName} ${created.lastName}`,
        specialty: specialty.name,
        box: box || 'Box Ambulatorio',
        action: 'PROFESSIONAL_ONBOARDED',
      },
    });

    return created;
  }

  async updateStatus(id: string, isActive: boolean, adminUserId?: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!professional) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        message: 'El profesional de salud solicitado no existe.',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const prof = await tx.professional.update({
        where: { id },
        data: { isActive },
        include: {
          specialties: { include: { specialty: true } },
          schedules: true,
        },
      });

      if (professional.userId) {
        await tx.user.update({
          where: { id: professional.userId },
          data: { isActive },
        });
      }

      return prof;
    });

    // Auditoría sanitaria
    await this.auditService.log({
      action: AuditAction.STATUS_CHANGE,
      resource: 'PROFESSIONAL',
      resourceId: updated.id,
      userId: adminUserId,
      details: {
        licenseNumber: professional.licenseNumber,
        previousState: professional.isActive,
        newState: isActive,
        action: isActive ? 'PROFESSIONAL_REACTIVATED' : 'PROFESSIONAL_DEACTIVATED_TERMINATED',
      },
    });

    return {
      message: isActive
        ? 'Médico reincorporado y habilitado exitosamente.'
        : 'Médico desvinculado e inactivado exitosamente (acceso revocado, historial médico preservado conforme a Ley 20.584).',
      professional: updated,
    };
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
