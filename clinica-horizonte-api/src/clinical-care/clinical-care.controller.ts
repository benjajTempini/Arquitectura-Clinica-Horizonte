import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConflictResponse } from '@nestjs/swagger';
import { ClinicalCareService } from './clinical-care.service';
import { CreateClinicalCareDto } from './dto/create-clinical-care.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('clinical-care')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class ClinicalCareController {
  constructor(private readonly clinicalCareService: ClinicalCareService) {}

  @Post('appointments/:appointmentId/clinical-care')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR)
  @ApiOperation({ summary: 'Registrar atención clínica, diagnósticos y tratamientos en una sola transacción' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita médica' })
  @ApiResponse({ status: 201, description: 'Atención clínica registrada exitosamente' })
  @ApiConflictResponse({ description: 'La cita ya cuenta con atención clínica (CLINICAL_CARE_EXISTS)' })
  async create(
    @Param('appointmentId') appointmentId: string,
    @Body() createDto: CreateClinicalCareDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicalCareService.create(appointmentId, createDto, user?.id);
  }

  @Get('patients/:patientId/clinical-history')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.NURSE)
  @ApiOperation({ summary: 'Consultar el historial clínico cronológico autorizado del paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Historial clínico cronológico' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async getHistory(@Param('patientId') patientId: string, @CurrentUser() user: any) {
    return this.clinicalCareService.getPatientHistory(patientId, user?.id);
  }
}
