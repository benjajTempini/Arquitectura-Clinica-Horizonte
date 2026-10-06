import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 15000, description: 'Monto pagado en pesos chilenos (>= 0)' })
  @IsNotEmpty({ message: 'El monto es obligatorio.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser numérico.' })
  @Min(0, { message: 'El monto no puede ser negativo.' })
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BONO_FONASA,
    description: 'Método de pago: CASH, DEBIT_CARD, CREDIT_CARD, BONO_FONASA, BONO_ISAPRE, TRANSFER',
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio.' })
  @IsEnum(PaymentMethod, { message: 'Método de pago inválido.' })
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'FONASA-994821', description: 'Número de bono oficial (Obligatorio si el método es BONO)' })
  @IsOptional()
  @IsString({ message: 'El número de folio o bono debe ser texto.' })
  voucherNumber?: string;

  @ApiPropertyOptional({ example: 'Juan Pablo Araya' })
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional({ example: 'TX-492019' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'Pago en mesón recepción 1' })
  @IsOptional()
  @IsString()
  notes?: string;
}
