import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RoleName } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('appointments/:appointmentId/payments')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Registrar pago o bono para una cita médica' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita' })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Número de bono obligatorio o monto inválido' })
  async create(
    @Param('appointmentId') appointmentId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.create(appointmentId, createPaymentDto, user?.id);
  }

  @Get('appointments/:appointmentId/payments')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Consultar pagos asociados a una cita' })
  @ApiParam({ name: 'appointmentId', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Listado de pagos' })
  async findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Patch('payments/:paymentId/status')
  @Roles(RoleName.ADMIN, RoleName.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Anular o reembolsar un pago registrado' })
  @ApiParam({ name: 'paymentId', description: 'UUID del pago' })
  @ApiResponse({ status: 200, description: 'Estado del pago actualizado' })
  async updateStatus(
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.updateStatus(paymentId, dto, user?.id);
  }
}
