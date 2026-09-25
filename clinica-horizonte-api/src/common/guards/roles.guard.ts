import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'No posee los permisos necesarios para realizar esta operación.',
      });
    }

    // El rol ADMIN siempre tiene acceso a todas las rutas
    const hasRole = user.roles.some((role: RoleName) =>
      requiredRoles.includes(role) || role === RoleName.ADMIN
    );

    if (!hasRole) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}.`,
      });
    }

    return true;
  }
}
