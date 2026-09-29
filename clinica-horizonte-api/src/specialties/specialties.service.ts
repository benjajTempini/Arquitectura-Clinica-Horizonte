import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FALLBACK_SPECIALTIES = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    code: 'MED-GEN',
    name: 'Medicina General',
    description: 'Atención médica primaria integral para adultos y controles de salud.',
    defaultDurationMin: 20,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    code: 'PED-01',
    name: 'Pediatría Integral',
    description: 'Atención integral para niños y adolescentes con control de niño sano.',
    defaultDurationMin: 30,
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    code: 'CAR-01',
    name: 'Cardiología Preventiva',
    description: 'Evaluación y seguimiento cardiovascular integral y prevención de infartos.',
    defaultDurationMin: 30,
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    code: 'TRA-01',
    name: 'Traumatología',
    description: 'Atención del aparato locomotor, lesiones deportivas y articulares.',
    defaultDurationMin: 20,
  },
];

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const items = await this.prisma.specialty.findMany({
        orderBy: { name: 'asc' },
      });
      if (items && items.length > 0) return items;
      return FALLBACK_SPECIALTIES;
    } catch {
      return FALLBACK_SPECIALTIES;
    }
  }

  async findById(id: string) {
    try {
      const item = await this.prisma.specialty.findUnique({
        where: { id },
      });
      if (item) return item;
    } catch {
      // Fallback
    }
    return FALLBACK_SPECIALTIES.find((s) => s.id === id) || null;
  }
}
