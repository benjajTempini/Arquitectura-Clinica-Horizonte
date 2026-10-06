import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { AuditAction } from '@prisma/client';
import { normalizeNationalId } from '../common/utils/rut.util';


@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(createPatientDto: CreatePatientDto, currentUserId?: string) {
    const normalizedNationalId = normalizeNationalId(createPatientDto.nationalId);

    // Validar fecha de nacimiento coherente
    const birthDate = new Date(createPatientDto.birthDate);
    const now = new Date();
    if (isNaN(birthDate.getTime()) || birthDate > now || birthDate.getFullYear() < 1900) {
      throw new BadRequestException({
        code: 'INVALID_BIRTH_DATE',
        message: 'La fecha de nacimiento debe ser una fecha válida y anterior a la fecha actual.',
      });
    }

    const existing = await this.prisma.patient.findUnique({
      where: { nationalId: normalizedNationalId },
    });

    if (existing) {
      throw new ConflictException({
        code: 'PATIENT_DUPLICATE',
        message: `Ya existe un paciente registrado con el identificador/RUT ${createPatientDto.nationalId}.`,
      });
    }

    const patient = await this.prisma.patient.create({
      data: {
        nationalId: normalizedNationalId,
        firstName: createPatientDto.firstName.trim(),
        lastName: createPatientDto.lastName.trim(),
        birthDate,
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
    const cleanSearch = search ? search.replace(/\./g, '') : '';

    const orConditions: any[] = [];
    if (search) {
      orConditions.push(
        { nationalId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      );
      if (cleanSearch !== search) {
        orConditions.push({ nationalId: { contains: cleanSearch, mode: 'insensitive' } });
      }
    }

    const where: any = orConditions.length > 0 ? { OR: orConditions } : {};

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
