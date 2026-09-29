import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('professionals')
@ApiBearerAuth()
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar profesionales de la salud activos y sus especialidades' })
  @ApiResponse({ status: 200, description: 'Listado de profesionales' })
  async findAll() {
    return this.professionalsService.findAll();
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
