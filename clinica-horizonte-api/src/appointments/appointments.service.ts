import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { AppointmentStatus, AuditAction } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async validateNoOverlap(
    professionalId: string,
    startTimeStr: string,
    endTimeStr: string,
    excludeAppointmentId?: string,
  ) {
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException({
        code: 'INVALID_INTERVAL',
        message: 'La fecha y hora de término debe ser estrictamente posterior a la hora de inicio.',
      });
    }

    // Comprobar conflicto con citas activas
    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        professionalId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflicting) {
      throw new ConflictException({
        statusCode: 409,
        code: 'APPOINTMENT_OVERLAP',
        message: 'El profesional ya tiene una cita en ese intervalo.',
        details: [
          {
            conflictingAppointmentId: conflicting.id,
            start: conflicting.startTime,
            end: conflicting.endTime,
          },
        ],
      });
    }
  }

  async create(dto: CreateAppointmentDto, currentUserId?: string) {
    // 1. Validar existencia del paciente, profesional y especialidad
    const [patient, professional, specialty] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.professional.findUnique({ where: { id: dto.professionalId } }),
      this.prisma.specialty.findUnique({ where: { id: dto.specialtyId } }),
    ]);

    if (!patient) throw new NotFoundException({ code: 'PATIENT_NOT_FOUND', message: 'Paciente no encontrado.' });
    if (!professional) throw new NotFoundException({ code: 'PROFESSIONAL_NOT_FOUND', message: 'Profesional no encontrado.' });
    if (!specialty) throw new NotFoundException({ code: 'SPECIALTY_NOT_FOUND', message: 'Especialidad no encontrada.' });

    // 2. Validar que no haya solapamiento
    await this.validateNoOverlap(dto.professionalId, dto.startTime, dto.endTime);

    // 3. Crear cita
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        specialtyId: dto.specialtyId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: AppointmentStatus.PENDING,
        reason: dto.reason?.trim(),
        notes: dto.notes?.trim(),
      },
      include: {
        patient: { select: { firstName: true, lastName: true, nationalId: true, phone: true } },
        professional: { select: { firstName: true, lastName: true } },
        specialty: { select: { name: true } },
      },
    });

    // 4. Auditoría
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'APPOINTMENT',
      resourceId: appointment.id,
      userId: currentUserId,
      details: {
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        start: dto.startTime,
        end: dto.endTime,
      },
    });

    return appointment;
  }

  async findAll(filter: AppointmentFilterDto) {
    const take = Number(filter.limit) || 50;
    const skip = Number(filter.offset) || 0;

    const where: any = {};
    if (filter.professionalId) where.professionalId = filter.professionalId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.status) where.status = filter.status;

    if (filter.date) {
      const [year, month, day] = filter.date.split('-').map(Number);
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
      where.startTime = { gte: dayStart, lte: dayEnd };
    }

    const [total, items] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        take,
        skip,
        orderBy: { startTime: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, nationalId: true, phone: true } },
          professional: { select: { id: true, firstName: true, lastName: true } },
          specialty: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true, method: true, status: true, voucherNumber: true } },
          clinicalCare: { select: { id: true } },
        },
      }),
    ]);

    return { total, limit: take, offset: skip, items };
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: true,
        specialty: true,
        payments: true,
        clinicalCare: {
          include: {
            diagnoses: true,
            treatments: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'La cita especificada no existe.',
      });
    }

    return appointment;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto, currentUserId?: string) {
    const appt = await this.findById(id);

    if (appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_FOR_RESCHEDULE',
        message: `No es posible reprogramar una cita con estado ${appt.status}.`,
      });
    }

    await this.validateNoOverlap(appt.professionalId, dto.startTime, dto.endTime, id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        notes: dto.reason ? `${appt.notes || ''} [Reprogramada: ${dto.reason}]`.trim() : appt.notes,
      },
      include: {
        patient: true,
        professional: true,
      },
    });

    await this.auditService.log({
      action: AuditAction.RESCHEDULE,
      resource: 'APPOINTMENT',
      resourceId: id,
      userId: currentUserId,
      details: { oldStart: appt.startTime, newStart: dto.startTime, reason: dto.reason },
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, currentUserId?: string) {
    const appt = await this.findById(id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes ? `${appt.notes || ''} [Estado ${dto.status}: ${dto.notes}]`.trim() : appt.notes,
      },
    });

    await this.auditService.log({
      action: AuditAction.STATUS_CHANGE,
      resource: 'APPOINTMENT',
      resourceId: id,
      userId: currentUserId,
      details: { previousStatus: appt.status, newStatus: dto.status, notes: dto.notes },
    });

    return updated;
  }
}
