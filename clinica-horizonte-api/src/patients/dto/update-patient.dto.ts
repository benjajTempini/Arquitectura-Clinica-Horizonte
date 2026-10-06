import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: '+56 9 8765 4321' })
  @IsOptional()
  @Matches(/^(\+?56)?\s?9?\s?\d{4}\s?\d{4}$|^\+?[0-9\s-]{8,16}$/, {
    message: 'El teléfono debe tener un formato válido.',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'nuevo.correo@ejemplo.cl' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ example: 'Nueva Dirección 456' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La dirección no puede superar 255 caracteres.' })
  address?: string;

  @ApiPropertyOptional({ example: 'Contacto actualizado +56 9 9999 8888' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El contacto de emergencia no puede superar 255 caracteres.' })
  emergencyContact?: string;
}
