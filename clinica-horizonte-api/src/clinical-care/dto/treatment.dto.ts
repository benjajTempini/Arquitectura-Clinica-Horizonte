import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class TreatmentDto {
  @ApiProperty({ example: 'Losartán Potásico' })
  @IsNotEmpty({ message: 'El medicamento o tratamiento es obligatorio.' })
  @IsString()
  medication: string;

  @ApiProperty({ example: '50 mg' })
  @IsNotEmpty({ message: 'La dosis es obligatoria.' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'Cada 24 horas (mañana)' })
  @IsNotEmpty({ message: 'La frecuencia es obligatoria.' })
  @IsString()
  frequency: string;

  @ApiProperty({ example: 30, description: 'Duración en días' })
  @IsNotEmpty({ message: 'La duración en días es obligatoria.' })
  @IsInt({ message: 'La duración debe ser un número entero de días.' })
  @IsPositive({ message: 'La duración debe ser positiva.' })
  durationDays: number;

  @ApiPropertyOptional({ example: 'Tomar con abundante agua en ayunas.' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
