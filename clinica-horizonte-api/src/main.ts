import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno tanto si se ejecuta desde raíz como desde clinica-horizonte-api
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Prefijo global y versionamiento URI (/api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Habilitar CORS dinámico y seguro (compatible con AWS EC2 y localhost)
  const corsOriginEnv = process.env.CORS_ORIGIN || '*';
  const allowedOrigins = corsOriginEnv.split(',').map((s) => s.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, origin);
      }
      return callback(new Error(`Origen ${origin} no permitido por CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id'],
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Documentación OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Clínica Horizonte API')
    .setDescription(
      'API REST para la gestión integral de Clínica Horizonte: autenticación RBAC, pacientes, agenda, disponibilidad médica, atenciones clínicas, pagos y auditoría.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Ingrese el token JWT obtenido en /api/v1/auth/login',
    })
    .addTag('health', 'Comprobación de salud y disponibilidad')
    .addTag('auth', 'Autenticación y control de accesos')
    .addTag('patients', 'Gestión de pacientes')
    .addTag('professionals', 'Profesionales de la salud y disponibilidad')
    .addTag('specialties', 'Catálogo de especialidades médicas')
    .addTag('appointments', 'Agenda y citas médicas')
    .addTag('payments', 'Registro de pagos y bonos')
    .addTag('clinical-care', 'Ficha y atenciones clínicas')
    .addTag('audit', 'Auditoría inmutable de eventos sensibles')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  if (swaggerEnabled) {
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      customSiteTitle: 'Clínica Horizonte API Docs',
    });
    logger.log('Swagger UI disponible en /api/docs (Especificación JSON en /api/docs-json)');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Clínica Horizonte Backend API escuchando en el puerto ${port}`);
}

bootstrap();
