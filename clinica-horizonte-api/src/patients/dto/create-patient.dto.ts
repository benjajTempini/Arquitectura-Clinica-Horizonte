import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNationalId } from '../../common/validators/is-national-id.decorator';

export class CreatePatientDto {
  @ApiProperty({ example: '15420312-K', description: 'RUT o documento oficial sin puntos con guion' })
  @IsNotEmpty({ message: 'El identificador/RUT es obligatorio.' })
  @IsString()
  @IsNationalId()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\./g, '').trim().toUpperCase() : value))
  nationalId: string;

  @ApiProperty({ example: 'Carlos Alberto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).',
  })
  firstName: string;

  @ApiProperty({ example: 'Mendoza Peña' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @IsString()
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'Los apellidos solo pueden contener letras y espacios (sin números ni caracteres especiales).',
  })
  lastName: string;

  @ApiProperty({ example: '1982-04-15', description: 'Fecha de nacimiento YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD.' })
  birthDate: string;

  @ApiProperty({ example: 'MASCULINO', enum: ['MASCULINO', 'FEMENINO', 'OTRO'] })
  @IsNotEmpty({ message: 'El género es obligatorio.' })
  @IsIn(['MASCULINO', 'FEMENINO', 'OTRO'], { message: 'El género debe ser MASCULINO, FEMENINO u OTRO.' })
  gender: string;

  @ApiProperty({ example: '+56 9 8765 4321' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^(\+?56)?\s?9?\s?\d{4}\s?\d{4}$|^\+?[0-9\s-]{8,16}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +56 9 8765 4321 o 987654321).',
  })
  phone: string;

  @ApiProperty({ example: 'carlos.mendoza@ejemplo.cl' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiPropertyOptional({ example: 'Av. Providencia 1240, Dpto 502' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La dirección no puede superar 255 caracteres.' })
  address?: string;

  @ApiPropertyOptional({ example: 'Patricia Peña (Madre) +56 9 1111 2222' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El contacto de emergencia no puede superar 255 caracteres.' })
  emergencyContact?: string;
}
