import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'MED-10492', description: 'Número de Registro en la Superintendencia de Salud' })
  @IsNotEmpty({ message: 'El número de registro de la Superintendencia de Salud es obligatorio.' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  licenseNumber: string;

  @ApiProperty({ example: 'Rodrigo' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'El nombre solo puede contener letras y espacios (sin números).',
  })
  firstName: string;

  @ApiProperty({ example: 'Aravena Carrasco' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @IsString()
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'Los apellidos solo pueden contener letras y espacios (sin números).',
  })
  lastName: string;

  @ApiProperty({ example: 'dr.aravena@clinicahorizonte.cl' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo corporativo es obligatorio.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: '+56 9 7654 3210' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^(\+?56)?\s?9?\s?\d{4}\s?\d{4}$|^\+?[0-9\s-]{8,16}$/, {
    message: 'El teléfono debe tener un formato válido.',
  })
  phone: string;

  @ApiProperty({ example: 'uuid-especialidad', description: 'ID de la especialidad asignada' })
  @IsNotEmpty({ message: 'La especialidad médica es obligatoria.' })
  @IsString()
  specialtyId: string;

  @ApiPropertyOptional({ example: 'Box 204 — Sector Ambulatorio Norte' })
  @IsOptional()
  @IsString()
  box?: string;

  @ApiPropertyOptional({ example: 'Clinica2026!' })
  @IsOptional()
  @MinLength(6, { message: 'La contraseña inicial debe tener al menos 6 caracteres.' })
  password?: string;
}

