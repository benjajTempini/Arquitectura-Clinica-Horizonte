import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: '15420312-K', description: 'RUT o documento oficial sin puntos con guion' })
  @IsNotEmpty({ message: 'El identificador/RUT es obligatorio.' })
  @IsString()
  nationalId: string;

  @ApiProperty({ example: 'Carlos Alberto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Mendoza Peña' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1982-04-15', description: 'Fecha de nacimiento YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
  birthDate: string;

  @ApiProperty({ example: 'MASCULINO', enum: ['MASCULINO', 'FEMENINO', 'OTRO'] })
  @IsNotEmpty({ message: 'El género es obligatorio.' })
  @IsString()
  gender: string;

  @ApiProperty({ example: '+56 9 8765 4321' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'carlos.mendoza@ejemplo.cl' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;

  @ApiPropertyOptional({ example: 'Av. Providencia 1240, Dpto 502' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Patricia Peña (Madre) +56 9 1111 2222' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
