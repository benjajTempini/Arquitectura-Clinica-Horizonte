import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.specialty.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException({
        code: 'SPECIALTY_NOT_FOUND',
        message: 'La especialidad solicitada no existe.',
      });
    }
    return item;
  }
}

