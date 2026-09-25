import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: '+56 9 8765 4321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'nuevo.correo@ejemplo.cl' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email?: string;

  @ApiPropertyOptional({ example: 'Nueva Dirección 456' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Contacto actualizado +56 9 9999 8888' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
