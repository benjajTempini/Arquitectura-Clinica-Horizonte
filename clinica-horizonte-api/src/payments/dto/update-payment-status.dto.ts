import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.REFUNDED,
    description: 'Nuevo estado financiero: PAID, CANCELLED, REFUNDED',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsEnum(PaymentStatus, { message: 'Estado de pago inválido.' })
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Reembolso por anulación de cita' })
  @IsOptional()
  @IsString()
  notes?: string;
}
