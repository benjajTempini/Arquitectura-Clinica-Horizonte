import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
    description: 'Nuevo estado: PENDING, CONFIRMED, ARRIVED, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsEnum(AppointmentStatus, { message: 'El estado no es un valor válido del catálogo.' })
  status: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Cancelado por el paciente con 24 horas de antelación.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
