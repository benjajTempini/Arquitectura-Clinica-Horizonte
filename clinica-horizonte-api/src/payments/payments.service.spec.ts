import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

describe('PaymentsService - Registro de Pagos y Bonos', () => {
  let service: PaymentsService;

  const mockPrisma = {
    appointment: { findUnique: jest.fn() },
    payment: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  };

  const mockAudit = { log: jest.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('debe exigir número de bono si el método de pago es BONO_FONASA', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1' });

    await expect(
      service.create('appt-1', {
        amount: 12000,
        method: PaymentMethod.BONO_FONASA,
        voucherNumber: '',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe registrar exitosamente un bono con número de folio válido', async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1' });
    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      appointmentId: 'appt-1',
      amount: 12000,
      method: PaymentMethod.BONO_FONASA,
      status: PaymentStatus.PAID,
      voucherNumber: 'FONASA-12345',
    });

    const result = await service.create('appt-1', {
      amount: 12000,
      method: PaymentMethod.BONO_FONASA,
      voucherNumber: 'FONASA-12345',
    });

    expect(result.id).toBe('pay-1');
    expect(mockPrisma.payment.create).toHaveBeenCalled();
  });
});
