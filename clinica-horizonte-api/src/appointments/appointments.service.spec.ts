import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentsService - Prevención de Solapamiento', () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    appointment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    patient: { findUnique: jest.fn() },
    professional: { findUnique: jest.fn() },
    specialty: { findUnique: jest.fn() },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('debe rechazar una cita con hora de fin anterior a la de inicio', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.professional.findUnique.mockResolvedValue({ id: 'doc1' });
    mockPrisma.specialty.findUnique.mockResolvedValue({ id: 'spec1' });

    await expect(
      service.create({
        patientId: 'p1',
        professionalId: 'doc1',
        specialtyId: 'spec1',
        startTime: '2026-09-28T10:00:00.000Z',
        endTime: '2026-09-28T09:30:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar con APPOINTMENT_OVERLAP si existe una cita activa en el mismo intervalo', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.professional.findUnique.mockResolvedValue({ id: 'doc1' });
    mockPrisma.specialty.findUnique.mockResolvedValue({ id: 'spec1' });

    mockPrisma.appointment.findFirst.mockResolvedValue({
      id: 'existing-appt-id',
      professionalId: 'doc1',
      startTime: new Date('2026-09-28T09:00:00.000Z'),
      endTime: new Date('2026-09-28T09:30:00.000Z'),
      status: AppointmentStatus.CONFIRMED,
    });

    await expect(
      service.create({
        patientId: 'p1',
        professionalId: 'doc1',
        specialtyId: 'spec1',
        startTime: '2026-09-28T09:15:00.000Z',
        endTime: '2026-09-28T09:45:00.000Z',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
