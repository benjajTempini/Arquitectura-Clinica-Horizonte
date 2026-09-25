import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DiagnosisType } from '@prisma/client';

export class DiagnosisDto {
  @ApiProperty({ example: 'I10', description: 'Código de diagnóstico CIE-10' })
  @IsNotEmpty({ message: 'El código de diagnóstico es obligatorio.' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Hipertensión esencial (primaria)' })
  @IsNotEmpty({ message: 'La descripción del diagnóstico es obligatoria.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DiagnosisType, example: DiagnosisType.PRIMARY })
  @IsNotEmpty({ message: 'El tipo de diagnóstico es obligatorio.' })
  @IsEnum(DiagnosisType)
  type: DiagnosisType;
}
