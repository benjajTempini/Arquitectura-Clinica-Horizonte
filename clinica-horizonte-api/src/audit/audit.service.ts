import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    userId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      // Sanitizar detalles eliminando passwords, tokens o campos sensibles
      let sanitizedDetails = params.details;
      if (typeof sanitizedDetails === 'object' && sanitizedDetails !== null) {
        const copy = { ...sanitizedDetails };
        delete copy.password;
        delete copy.passwordHash;
        delete copy.token;
        delete copy.accessToken;
        sanitizedDetails = JSON.stringify(copy);
      } else if (typeof sanitizedDetails !== 'string') {
        sanitizedDetails = JSON.stringify(sanitizedDetails);
      }

      return await this.prisma.auditEvent.create({
        data: {
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          userId: params.userId,
          details: sanitizedDetails,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Error guardando evento de auditoría: ${error.message}`);
      return null;
    }
  }

  async findAll(query: { limit?: number; offset?: number; resource?: string }) {
    const take = Number(query.limit) || 50;
    const skip = Number(query.offset) || 0;

    const where: any = {};
    if (query.resource) {
      where.resource = query.resource;
    }

    const [total, items] = await Promise.all([
      this.prisma.auditEvent.count({ where }),
      this.prisma.auditEvent.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return { total, limit: take, offset: skip, items };
  }
}
