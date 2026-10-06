import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { DiagnosisType } from '@prisma/client';

export class DiagnosisDto {
  @ApiProperty({ example: 'I10', description: 'Código de diagnóstico CIE-10 oficial' })
  @IsNotEmpty({ message: 'El código de diagnóstico es obligatorio.' })
  @IsString()
  @Matches(/^[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/i, {
    message: 'El código de diagnóstico debe tener formato CIE-10 válido (ej: I10, J00, K29.7).',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({ example: 'Hipertensión esencial (primaria)' })
  @IsNotEmpty({ message: 'La descripción del diagnóstico es obligatoria.' })
  @IsString()
  @MinLength(3, { message: 'La descripción del diagnóstico debe tener al menos 3 caracteres.' })
  description: string;

  @ApiProperty({ enum: DiagnosisType, example: DiagnosisType.PRIMARY })
  @IsNotEmpty({ message: 'El tipo de diagnóstico es obligatorio.' })
  @IsEnum(DiagnosisType, { message: 'El tipo de diagnóstico debe ser PRIMARY, SECONDARY o PRESUMPTIVE.' })
  type: DiagnosisType;
}
