import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL establecida correctamente.');
    } catch (error) {
      this.logger.warn(`No se pudo conectar inmediatamente a PostgreSQL: ${error.message}. La base de datos operará en modo contingencia.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
