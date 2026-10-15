import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateProfessionalStatusDto {
  @ApiProperty({ example: false, description: 'Estado activo del profesional (false = desvinculado / inactivo)' })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsBoolean({ message: 'El estado debe ser booleano (true o false).' })
  isActive: boolean;
}

