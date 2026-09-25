import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-09-28', description: 'Fecha a consultar en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de consulta es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'El formato de fecha debe ser YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({ example: 'CAR-01', description: 'Código o UUID de la especialidad' })
  @IsOptional()
  @IsString()
  specialtyId?: string;
}
