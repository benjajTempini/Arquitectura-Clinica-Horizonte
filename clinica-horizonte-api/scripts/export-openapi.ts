import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('Clínica Horizonte API')
    .setDescription(
      'API REST para la plataforma Clínica Horizonte: autenticación RBAC, pacientes, agenda, disponibilidad médica, atenciones clínicas, pagos y auditoría.',
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

  const docsDir = path.resolve(__dirname, '../../Docs/api');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  console.log(`[OpenAPI] Contrato OpenAPI exportado exitosamente a: ${outputPath}`);
  await app.close();
}

exportOpenApi().catch((err) => {
  console.error('[OpenAPI] Error exportando contrato:', err);
  process.exit(1);
});
