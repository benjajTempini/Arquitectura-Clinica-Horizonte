import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { formatRut } from '../common/utils/rut.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas. Por favor verifique el correo y la contraseña.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas. Por favor verifique el correo y la contraseña.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'La cuenta de usuario se encuentra desactivada.',
      });
    }

    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const payload = { sub: user.id, email: user.email, roles };
    const accessToken = this.jwtService.sign(payload);

    // Registro de auditoría
    await this.auditService.log({
      action: AuditAction.LOGIN,
      resource: 'AUTH',
      resourceId: user.id,
      userId: user.id,
      details: { email: user.email, roles },
      ipAddress,
      userAgent,
    });

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 28800, // 8 horas
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
        },
      };
    }

    async register(
      dto: RegisterPatientDto,
      ipAddress?: string,
      userAgent?: string,
    ): Promise<AuthResponseDto> {
      const { email, password, firstName, lastName, nationalId, phone, birthDate, gender } = dto;
      const cleanEmail = email.trim().toLowerCase();

      // 1. Verificar si el correo ya existe en User
      const existingUser = await this.prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'El correo electrónico ya está registrado en el sistema. Por favor inicie sesión.',
        });
      }

      // 2. Normalizar RUT (ej: 12.345.678-5 -> 12345678-5)
      const normalizedRut = formatRut(nationalId);

      // 3. Verificar si el paciente ya existe en la base de datos
      const existingPatient = await this.prisma.patient.findUnique({
        where: { nationalId: normalizedRut },
      });

      if (existingPatient && existingPatient.userId) {
        throw new ConflictException({
          code: 'PATIENT_ALREADY_REGISTERED',
          message: 'Ya existe una cuenta vinculada a este RUT. Por favor inicie sesión.',
        });
      }

      // 4. Obtener o asegurar rol PATIENT
      let patientRole = await this.prisma.role.findUnique({
        where: { name: RoleName.PATIENT },
      });

      if (!patientRole) {
        patientRole = await this.prisma.role.create({
          data: {
            name: RoleName.PATIENT,
            description: 'Paciente con acceso a sus citas y solicitudes',
          },
        });
      }

      // 5. Encriptar contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // 6. Fecha de nacimiento por defecto si no fue provista
      const patientBirthDate = birthDate ? new Date(birthDate) : new Date('1995-01-01');
      const patientGender = gender || 'OTRO';

      // 7. Crear usuario y ficha de paciente en transacción atómica
      const newUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: cleanEmail,
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            isActive: true,
            userRoles: {
              create: {
                roleId: patientRole.id,
              },
            },
          },
        });

        if (existingPatient) {
          // Si el paciente existía en la base clínica previa sin cuenta digital, vincularlo
          await tx.patient.update({
            where: { id: existingPatient.id },
            data: {
              userId: user.id,
              email: cleanEmail,
              phone: phone.trim(),
            },
          });
        } else {
          // Crear nueva ficha de paciente
          await tx.patient.create({
            data: {
              nationalId: normalizedRut,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              birthDate: patientBirthDate,
              gender: patientGender,
              phone: phone.trim(),
              email: cleanEmail,
              userId: user.id,
            },
          });
        }

        return user;
      });

      // 8. Generar token JWT
      const roles = [RoleName.PATIENT];
      const payload = { sub: newUser.id, email: newUser.email, roles };
      const accessToken = this.jwtService.sign(payload);

      // 9. Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.CREATE,
        resource: 'AUTH',
        resourceId: newUser.id,
        userId: newUser.id,
        details: { email: newUser.email, roles, action: 'PATIENT_SELF_REGISTRATION' },
        ipAddress,
        userAgent,
      });

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 28800,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          roles,
        },
      };
    }
  }
