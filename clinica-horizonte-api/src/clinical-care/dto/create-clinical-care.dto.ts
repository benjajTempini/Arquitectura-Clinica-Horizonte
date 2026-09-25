import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DiagnosisDto } from './diagnosis.dto';
import { TreatmentDto } from './treatment.dto';

export class CreateClinicalCareDto {
  @ApiProperty({ example: 'Control rutinario por sospecha de hipertensión' })
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio.' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 'Paciente refiere mareos leves ocasionales en las tardes.' })
  @IsNotEmpty({ message: 'La anamnesis es obligatoria.' })
  @IsString()
  anamnesis: string;

  @ApiPropertyOptional({ example: 'Paciente lúcido, hidratado. Examen pulmonar normal.' })
  @IsOptional()
  @IsString()
  physicalExam?: string;

  @ApiPropertyOptional({ example: '{"pa": "130/80", "fc": 72, "temp": 36.6, "sat": 98}' })
  @IsOptional()
  @IsString()
  vitalSigns?: string;

  @ApiPropertyOptional({ example: 'Disminuir consumo de sal, control en 1 mes.' })
  @IsOptional()
  @IsString()
  indication?: string;

  @ApiProperty({ type: [DiagnosisDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses: DiagnosisDto[];

  @ApiPropertyOptional({ type: [TreatmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentDto)
  treatments?: TreatmentDto[];
}
