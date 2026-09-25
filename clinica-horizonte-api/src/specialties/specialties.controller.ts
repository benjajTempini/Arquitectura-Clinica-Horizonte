import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';

@ApiTags('specialties')
@ApiBearerAuth()
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar catálogo de especialidades médicas' })
  @ApiResponse({ status: 200, description: 'Especialidades disponibles' })
  async findAll() {
    return this.specialtiesService.findAll();
  }
}
