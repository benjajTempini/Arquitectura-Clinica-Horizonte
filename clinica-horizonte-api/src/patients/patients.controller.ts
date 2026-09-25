import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Registrar nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'Identificador o RUT duplicado' })
  async create(@Body() createPatientDto: CreatePatientDto, @CurrentUser() user: any) {
    return this.patientsService.create(createPatientDto, user?.id);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.DOCTOR, RoleName.NURSE)
  @ApiOperation({ summary: 'Consultar listado de pacientes con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Listado de pacientes' })
  async findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':patientId')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.DOCTOR, RoleName.NURSE)
  @ApiOperation({ summary: 'Consultar datos de un paciente por ID' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Detalle del paciente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async findOne(@Param('patientId') patientId: string) {
    return this.patientsService.findById(patientId);
  }

  @Patch(':patientId')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Actualizar información de contacto del paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async update(
    @Param('patientId') patientId: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.update(patientId, updatePatientDto, user?.id);
  }
}
