import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createPatientDto: CreatePatientDto, currentUserId?: string) {
    const existing = await this.prisma.patient.findUnique({
      where: { nationalId: createPatientDto.nationalId.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'PATIENT_DUPLICATE',
        message: `Ya existe un paciente registrado con el identificador/RUT ${createPatientDto.nationalId}.`,
      });
    }

    const patient = await this.prisma.patient.create({
      data: {
        nationalId: createPatientDto.nationalId.trim().toUpperCase(),
        firstName: createPatientDto.firstName.trim(),
        lastName: createPatientDto.lastName.trim(),
        birthDate: new Date(createPatientDto.birthDate),
        gender: createPatientDto.gender,
        phone: createPatientDto.phone.trim(),
        email: createPatientDto.email.trim().toLowerCase(),
        address: createPatientDto.address?.trim(),
        emergencyContact: createPatientDto.emergencyContact?.trim(),
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'PATIENT',
      resourceId: patient.id,
      userId: currentUserId,
      details: { nationalId: patient.nationalId, name: `${patient.firstName} ${patient.lastName}` },
    });

    return patient;
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            professional: { select: { firstName: true, lastName: true } },
            specialty: { select: { name: true } },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException({
        code: 'PATIENT_NOT_FOUND',
        message: 'El paciente solicitado no existe en los registros.',
      });
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, currentUserId?: string) {
    await this.findById(id);

    const updated = await this.prisma.patient.update({
      where: { id },
      data: {
        ...(updatePatientDto.phone && { phone: updatePatientDto.phone.trim() }),
        ...(updatePatientDto.email && { email: updatePatientDto.email.trim().toLowerCase() }),
        ...(updatePatientDto.address && { address: updatePatientDto.address.trim() }),
        ...(updatePatientDto.emergencyContact && { emergencyContact: updatePatientDto.emergencyContact.trim() }),
      },
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'PATIENT',
      resourceId: id,
      userId: currentUserId,
      details: updatePatientDto,
    });

    return updated;
  }

  async findAll(query: PatientQueryDto) {
    const take = Number(query.limit) || 20;
    const skip = Number(query.offset) || 0;
    const search = query.search?.trim();

    const where: any = search
      ? {
          OR: [
            { nationalId: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        take,
        skip,
        orderBy: { lastName: 'asc' },
      }),
    ]);

    return { total, limit: take, offset: skip, items };
  }
}
