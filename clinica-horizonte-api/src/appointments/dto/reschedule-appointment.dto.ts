import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-09-29T10:00:00.000Z', description: 'Nueva fecha y hora de inicio ISO 8601' })
  @IsNotEmpty({ message: 'La nueva hora de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La hora de inicio debe ser una fecha ISO válida.' })
  startTime: string;

  @ApiProperty({ example: '2026-09-29T10:20:00.000Z', description: 'Nueva fecha y hora de término ISO 8601' })
  @IsNotEmpty({ message: 'La nueva hora de término es obligatoria.' })
  @IsDateString({}, { message: 'La hora de término debe ser una fecha ISO válida.' })
  endTime: string;

  @ApiPropertyOptional({ example: 'Paciente solicitó cambio de turno laboral' })
  @IsOptional()
  @IsString()
  reason?: string;
}
