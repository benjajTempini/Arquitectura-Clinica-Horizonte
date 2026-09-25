import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'b1234567-89ab-cdef-0123-456789abcdef', description: 'UUID del paciente' })
  @IsNotEmpty({ message: 'El paciente es obligatorio.' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'c1234567-89ab-cdef-0123-456789abcdef', description: 'UUID del profesional' })
  @IsNotEmpty({ message: 'El profesional es obligatorio.' })
  @IsString()
  professionalId: string;

  @ApiProperty({ example: 'd1234567-89ab-cdef-0123-456789abcdef', description: 'UUID de la especialidad' })
  @IsNotEmpty({ message: 'La especialidad es obligatoria.' })
  @IsString()
  specialtyId: string;

  @ApiProperty({ example: '2026-09-28T09:00:00.000Z', description: 'Fecha y hora de inicio ISO 8601' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La hora de inicio debe ser una fecha ISO válida.' })
  startTime: string;

  @ApiProperty({ example: '2026-09-28T09:20:00.000Z', description: 'Fecha y hora de término ISO 8601' })
  @IsNotEmpty({ message: 'La hora de término es obligatoria.' })
  @IsDateString({}, { message: 'La hora de término debe ser una fecha ISO válida.' })
  endTime: string;

  @ApiPropertyOptional({ example: 'Control rutinario de presión' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Paciente prefiere atención puntual por traslado' })
  @IsOptional()
  @IsString()
  notes?: string;
}
