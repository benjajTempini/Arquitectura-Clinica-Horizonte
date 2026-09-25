import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClinicalCareDto } from './dto/create-clinical-care.dto';
import { AppointmentStatus, AuditAction } from '@prisma/client';

@Injectable()
export class ClinicalCareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreateClinicalCareDto, currentUserId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { clinicalCare: true },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'La cita indicada no existe.',
      });
    }

    if (appointment.clinicalCare) {
      throw new ConflictException({
        code: 'CLINICAL_CARE_EXISTS',
        message: 'Esta cita ya cuenta con una atención clínica registrada.',
      });
    }

    // Ejecutar creación transaccional
    const result = await this.prisma.$transaction(async (tx) => {
      const care = await tx.clinicalCare.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          professionalId: appointment.professionalId,
          reason: dto.reason.trim(),
          anamnesis: dto.anamnesis.trim(),
          physicalExam: dto.physicalExam?.trim(),
          vitalSigns: dto.vitalSigns?.trim(),
          indication: dto.indication?.trim(),
        },
      });

      if (dto.diagnoses && dto.diagnoses.length > 0) {
        await tx.diagnosis.createMany({
          data: dto.diagnoses.map((d) => ({
            clinicalCareId: care.id,
            code: d.code.trim().toUpperCase(),
            description: d.description.trim(),
            type: d.type,
          })),
        });
      }

      if (dto.treatments && dto.treatments.length > 0) {
        await tx.treatment.createMany({
          data: dto.treatments.map((t) => ({
            clinicalCareId: care.id,
            medication: t.medication.trim(),
            dosage: t.dosage.trim(),
            frequency: t.frequency.trim(),
            durationDays: t.durationDays,
            instructions: t.instructions?.trim(),
          })),
        });
      }

      // Finalizar estado de la cita
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });

      return tx.clinicalCare.findUnique({
        where: { id: care.id },
        include: {
          diagnoses: true,
          treatments: true,
          patient: { select: { firstName: true, lastName: true, nationalId: true } },
          professional: { select: { firstName: true, lastName: true } },
        },
      });
    });

    // Auditoría sin exponer diagnósticos específicos en texto plano no sanitizado
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'CLINICAL_CARE',
      resourceId: result?.id,
      userId: currentUserId,
      details: {
        appointmentId,
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        diagnosesCount: dto.diagnoses.length,
      },
    });

    return result;
  }

  async getPatientHistory(patientId: string, currentUserId?: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException({
        code: 'PATIENT_NOT_FOUND',
        message: 'El paciente no existe en el sistema.',
      });
    }

    const history = await this.prisma.clinicalCare.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        professional: {
          select: { firstName: true, lastName: true, email: true },
        },
        diagnoses: true,
        treatments: true,
        appointment: {
          select: { startTime: true, endTime: true, specialty: { select: { name: true } } },
        },
      },
    });

    // Auditoría de acceso a ficha clínica
    await this.auditService.log({
      action: AuditAction.VIEW_CLINICAL,
      resource: 'PATIENT_CLINICAL_HISTORY',
      resourceId: patientId,
      userId: currentUserId,
      details: { patientId, recordsReturned: history.length },
    });

    return history;
  }
}
