import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConflictResponse, ApiQuery } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalStatusDto } from './dto/update-status.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('professionals')
@ApiBearerAuth()
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar profesionales de la salud (con filtro opcional de inactivos)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Listado de profesionales' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.professionalsService.findAll(includeInactive === 'true');
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Dar de alta a un nuevo médico (Exclusivo Administrador)' })
  @ApiResponse({ status: 201, description: 'Médico creado e incorporado exitosamente con usuario y especialidad' })
  @ApiConflictResponse({ description: 'El registro de superintendencia o correo corporativo ya existe' })
  async create(@Body() createDto: CreateProfessionalDto, @CurrentUser() user: any) {
    return this.professionalsService.create(createDto, user?.id);
  }

  @Patch(':professionalId/status')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado del médico: Activar o Desvincular (Exclusivo Administrador)' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  async updateStatus(
    @Param('professionalId') professionalId: string,
    @Body() statusDto: UpdateProfessionalStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.professionalsService.updateStatus(professionalId, statusDto.isActive, user?.id);
  }

  @Public()
  @Get(':professionalId/availability')
  @ApiOperation({ summary: 'Consultar disponibilidad de horarios para un profesional y fecha' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional de salud' })
  @ApiResponse({ status: 200, description: 'Franjas horarias y estado de disponibilidad' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async getAvailability(
    @Param('professionalId') professionalId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.professionalsService.getAvailability(professionalId, query);
  }
}
