import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

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
}
