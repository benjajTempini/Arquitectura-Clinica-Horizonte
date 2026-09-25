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
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.PATIENT)
  @ApiOperation({ summary: 'Crear una cita médica validando no solapamiento' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @ApiConflictResponse({ description: 'Conflicto por horario ocupado (APPOINTMENT_OVERLAP)' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(createAppointmentDto, user?.id);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.DOCTOR, RoleName.NURSE)
  @ApiOperation({ summary: 'Consultar agenda de citas con filtros' })
  @ApiResponse({ status: 200, description: 'Listado de citas' })
  async findAll(@Query() filter: AppointmentFilterDto) {
    return this.appointmentsService.findAll(filter);
  }

  @Get(':appointmentId')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.DOCTOR, RoleName.NURSE)
  @ApiOperation({ summary: 'Consultar detalle de una cita' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Detalle de la cita' })
  async findOne(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.findById(appointmentId);
  }

  @Patch(':appointmentId/reschedule')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.PATIENT)
  @ApiOperation({ summary: 'Reprogramar una cita médica' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Cita reprogramada exitosamente' })
  @ApiConflictResponse({ description: 'Conflicto por solapamiento con otra cita existente' })
  async reschedule(
    @Param('appointmentId') appointmentId: string,
    @Body() rescheduleDto: RescheduleAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.reschedule(appointmentId, rescheduleDto, user?.id);
  }

  @Patch(':appointmentId/status')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE, RoleName.DOCTOR)
  @ApiOperation({ summary: 'Cambiar el estado operativo de una cita médica' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
  async updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(appointmentId, updateStatusDto, user?.id);
  }
}
