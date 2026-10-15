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
import { IsNationalId } from '../../common/validators/is-national-id.decorator';

export class RegisterPatientDto {
  @ApiProperty({ example: '12.345.678-5', description: 'RUT chileno del paciente' })
  @IsNotEmpty({ message: 'El RUT es obligatorio.' })
  @IsString()
  @IsNationalId()
  nationalId: string;

  @ApiProperty({ example: 'Sofía Andrea' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'El nombre solo puede contener letras y espacios (sin números).',
  })
  firstName: string;

  @ApiProperty({ example: 'Contreras Díaz' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @IsString()
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar 100 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, {
    message: 'Los apellidos solo pueden contener letras y espacios (sin números).',
  })
  lastName: string;

  @ApiProperty({ example: 'sofia.contreras@ejemplo.cl' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'MiClave2026!' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @ApiProperty({ example: '+56 9 8765 4321' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^(\+?56)?\s?9?\s?\d{4}\s?\d{4}$|^\+?[0-9\s-]{8,16}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +56 9 8765 4321 o 987654321).',
  })
  phone: string;

  @ApiPropertyOptional({ example: '1995-05-20', description: 'Fecha de nacimiento YYYY-MM-DD' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD.' })
  birthDate?: string;

  @ApiPropertyOptional({ example: 'FEMENINO', enum: ['MASCULINO', 'FEMENINO', 'OTRO'] })
  @IsOptional()
  gender?: string;
}

