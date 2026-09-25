import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { AuditAction, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreatePaymentDto, currentUserId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'La cita asociada al pago no existe.',
      });
    }

    // Regla de negocio: número de bono obligatorio para Fonasa o Isapre
    if (
      (dto.method === PaymentMethod.BONO_FONASA || dto.method === PaymentMethod.BONO_ISAPRE) &&
      (!dto.voucherNumber || dto.voucherNumber.trim().length === 0)
    ) {
      throw new BadRequestException({
        code: 'VOUCHER_NUMBER_REQUIRED',
        message: 'El número de bono es obligatorio para pagos con Fonasa o Isapre.',
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        appointmentId,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.PAID,
        voucherNumber: dto.voucherNumber?.trim(),
        payerName: dto.payerName?.trim(),
        transactionReference: dto.transactionReference?.trim(),
        notes: dto.notes?.trim(),
        registeredById: currentUserId,
      },
    });

    await this.auditService.log({
      action: AuditAction.PAYMENT_REGISTER,
      resource: 'PAYMENT',
      resourceId: payment.id,
      userId: currentUserId,
      details: {
        appointmentId,
        amount: dto.amount,
        method: dto.method,
        voucherNumber: dto.voucherNumber,
      },
    });

    return payment;
  }

  async findByAppointment(appointmentId: string) {
    return this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(paymentId: string, dto: UpdatePaymentStatusDto, currentUserId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'El pago especificado no existe.',
      });
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        notes: dto.notes ? `${payment.notes || ''} [Estado: ${dto.status} - ${dto.notes}]`.trim() : payment.notes,
      },
    });

    await this.auditService.log({
      action: AuditAction.STATUS_CHANGE,
      resource: 'PAYMENT',
      resourceId: paymentId,
      userId: currentUserId,
      details: { previousStatus: payment.status, newStatus: dto.status, reason: dto.notes },
    });

    return updated;
  }
}
