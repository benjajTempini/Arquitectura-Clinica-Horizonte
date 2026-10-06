import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('audit-events')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.EXTERNAL_SUPPORT)
  @ApiOperation({ summary: 'Consultar eventos de auditoría sanitizados (Solo Administradores y Soporte Externo)' })
  @ApiResponse({ status: 200, description: 'Listado de eventos de auditoría' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }
}
