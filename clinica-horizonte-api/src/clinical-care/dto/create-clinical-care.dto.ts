import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DiagnosisDto } from './diagnosis.dto';
import { TreatmentDto } from './treatment.dto';

export class CreateClinicalCareDto {
  @ApiProperty({ example: 'Control rutinario por sospecha de hipertensión' })
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio.' })
  @IsString()
  @MinLength(3, { message: 'El motivo de consulta debe tener al menos 3 caracteres.' })
  reason: string;

  @ApiProperty({ example: 'Paciente refiere mareos leves ocasionales en las tardes.' })
  @IsNotEmpty({ message: 'La anamnesis es obligatoria.' })
  @IsString()
  @MinLength(5, { message: 'La anamnesis debe contener una descripción clínica detallada (al menos 5 caracteres).' })
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

  @ApiProperty({ type: [DiagnosisDto], description: 'Lista de diagnósticos CIE-10 (mínimo 1)' })
  @IsArray({ message: 'Los diagnósticos deben ser proporcionados en una lista.' })
  @ArrayMinSize(1, { message: 'Debe ingresar al menos un diagnóstico clínico oficial CIE-10.' })
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses: DiagnosisDto[];

  @ApiPropertyOptional({ type: [TreatmentDto], description: 'Lista de medicamentos o indicaciones' })
  @IsOptional()
  @IsArray({ message: 'Los tratamientos deben ser proporcionados en una lista.' })
  @ValidateNested({ each: true })
  @Type(() => TreatmentDto)
  treatments?: TreatmentDto[];
}
