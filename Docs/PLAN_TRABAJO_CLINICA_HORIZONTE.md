# Plan de trabajo técnico — Clínica Horizonte

> Documento operativo para agentes de desarrollo como Antigravity, GitHub Copilot, Claude Code, Codex u otros agentes capaces de modificar repositorios.

## 0. Instrucciones obligatorias para el agente

### Objetivo de este documento

Construir una nueva plataforma para **Clínica Horizonte** que reemplace y mejore el sistema anterior, preserve la continuidad de los datos y solucione carencias de seguridad, trazabilidad, agenda, pagos, soporte y mantenibilidad.

### Reglas de ejecución

1. Leer este documento completo antes de modificar el repositorio.
2. Inspeccionar el código, archivos de configuración, migraciones y pruebas existentes antes de proponer cambios.
3. No reemplazar decisiones arquitectónicas sin documentar el motivo.
4. Trabajar en incrementos pequeños, verificables y reversibles.
5. No inventar requisitos. Cuando falte una regla de negocio, registrar el supuesto en `docs/decisions/` y elegir la alternativa más conservadora.
6. No utilizar datos reales de pacientes en desarrollo, pruebas, logs, capturas o semillas.
7. No incluir secretos en Git, imágenes Docker, archivos de ejemplo ni documentación.
8. Mantener compatibilidad entre frontend, backend, base de datos, Docker y contrato OpenAPI.
9. Toda funcionalidad nueva debe incluir validación, gestión de errores, autorización, documentación OpenAPI y pruebas.
10. Antes de finalizar una tarea, ejecutar los controles definidos en la sección **Definition of Done**.
11. Si una verificación falla, corregirla antes de continuar o dejar el bloqueo documentado con evidencia reproducible.
12. No eliminar información clínica, financiera o de auditoría físicamente salvo que exista una regla explícita. Preferir estados, anulaciones y trazabilidad.

### Formato esperado de cada cambio

Cada cambio del agente debe indicar:

- objetivo;
- archivos modificados;
- decisiones y supuestos;
- migraciones añadidas;
- endpoints afectados;
- pruebas creadas o actualizadas;
- comandos de verificación ejecutados;
- riesgos o trabajo pendiente.

---

## 1. Contexto del sistema

Clínica Horizonte es una institución privada de atención ambulatoria que atiende aproximadamente a 180 pacientes al día. La plataforma será utilizada por personal médico, profesionales de salud, personal administrativo, recepción, administración técnica, pacientes y soporte externo autorizado.

La nueva solución reemplazará un sistema previo que ya gestionaba fichas clínicas, horas médicas, pacientes, diagnósticos, tratamientos, documentos, contactos, facturación y reportes. El nuevo sistema debe conservar las capacidades necesarias e incorporar mejoras de seguridad, experiencia de uso, trazabilidad, acceso controlado, despliegue y continuidad operacional.

### Objetivos principales

- Centralizar la gestión de pacientes, citas, atención clínica y pagos.
- Evitar conflictos y reservas superpuestas.
- Aplicar autenticación y autorización por roles.
- Mantener una auditoría de operaciones sensibles.
- Restringir y registrar el acceso del soporte externo.
- Migrar datos válidos desde el sistema anterior.
- Ejecutar cada sistema en un contenedor independiente.
- Documentar la API con OpenAPI y Swagger UI.
- Facilitar pruebas, despliegue y mantenimiento por agentes o personas.

---

## 2. Alcance

### Incluido en el MVP

- Autenticación y autorización basada en roles.
- Gestión de usuarios y roles.
- Registro, consulta y actualización de pacientes.
- Profesionales, especialidades y horarios.
- Consulta de disponibilidad.
- Creación, reprogramación, cancelación y cambio de estado de citas.
- Registro de pagos o bonos.
- Consulta del historial clínico autorizado.
- Registro de atención, diagnósticos y tratamientos.
- Auditoría de accesos y modificaciones.
- Migración inicial de pacientes y datos compatibles.
- Copias de seguridad y restauración documentada.
- Dockerización de frontend, backend y PostgreSQL.
- Contrato OpenAPI y Swagger UI.

### Fuera del MVP, pero contemplado en el diseño

- Portal completo de autoservicio para pacientes.
- Notificaciones multicanal.
- Reportes avanzados.
- Emisión avanzada de documentos.
- Interoperabilidad con otros prestadores.
- Métricas avanzadas.
- Accesibilidad ampliada.

---

## 3. Arquitectura aprobada

### Stack

- **Frontend:** Astro con TypeScript, SSR y componentes React para interfaces de alta interactividad.
- **Backend:** NestJS con TypeScript y API REST versionada.
- **Persistencia:** PostgreSQL.
- **ORM recomendado:** Prisma ORM y Prisma Migrate.
- **Contrato API:** OpenAPI 3.x generado con `@nestjs/swagger`.
- **Documentación interactiva:** Swagger UI.
- **Contenedores:** Docker y Docker Compose.
- **Infraestructura de destino:** AWS.
- **Arquitectura de aplicación:** monolito modular.

### Contenedores mínimos

1. `frontend`: Astro SSR, puerto interno `4321`.
2. `backend`: NestJS, puerto interno `3000`.
3. `database`: PostgreSQL, puerto interno `5432`, no expuesto públicamente en producción.
4. `migration`: contenedor temporal opcional para migrar información histórica.

### Flujo lógico

```text
Usuario
  |
  | HTTPS
  v
Astro SSR + React
  |
  | REST/JSON
  v
NestJS API
  |
  | Prisma
  v
PostgreSQL
```

### Reglas arquitectónicas

- Astro y React nunca se conectan directamente a PostgreSQL.
- NestJS concentra reglas de negocio, validación, autorización y persistencia.
- Ocultar un botón en el frontend no sustituye la autorización del backend.
- El frontend puede actuar como Backend for Frontend para conservar tokens en cookies `HttpOnly`.
- Los módulos del backend deben estar desacoplados por dominio, pero desplegarse inicialmente como una sola aplicación.
- El contrato OpenAPI es la referencia pública de integración entre frontend y backend.

---

## 4. Estructura recomendada del repositorio

```text
clinica-horizonte/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── middleware/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── patients/
│   │   ├── professionals/
│   │   ├── specialties/
│   │   ├── schedules/
│   │   ├── appointments/
│   │   ├── payments/
│   │   ├── clinical-care/
│   │   ├── diagnoses/
│   │   ├── treatments/
│   │   ├── audit/
│   │   ├── health/
│   │   └── common/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── migration/
│   ├── src/
│   ├── Dockerfile
│   └── README.md
├── database/
│   └── init.sql
├── docs/
│   ├── decisions/
│   ├── api/
│   ├── migration/
│   └── diagrams/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Actores y permisos

### Personal médico

- Consulta agenda propia.
- Consulta el historial clínico de pacientes asociados a una atención autorizada.
- Registra atenciones, diagnósticos, tratamientos, indicaciones y documentos.
- No administra usuarios ni pagos.

### Personal administrativo

- Consulta pagos, bonos, facturación y reportes administrativos.
- Accede solo a la información clínica estrictamente necesaria.
- No registra diagnósticos ni tratamientos.

### Recepcionista

- Registra y actualiza datos de contacto de pacientes.
- Consulta disponibilidad.
- Crea, reprograma y cancela citas.
- Confirma llegada.
- Registra pagos y bonos.
- No accede al historial clínico completo.

### Administrador del sistema

- Gestiona usuarios, roles, permisos y parámetros.
- Consulta auditoría.
- Supervisa accesos.
- No modifica silenciosamente información clínica o financiera.

### Soporte técnico externo

- Consulta métricas, salud de servicios y logs técnicos sanitizados.
- Obtiene acceso temporal, individual, limitado y auditable.
- No accede a fichas clínicas, contraseñas, tokens ni datos sensibles innecesarios.

### Paciente

- Consulta disponibilidad.
- Solicita y consulta sus propias citas.
- Cancela o solicita reprogramación según reglas configuradas.
- No accede a información de otros pacientes.

### Seguridad

La seguridad es un requisito transversal, no un actor.

---

## 6. Historias de usuario prioritarias

### HU-01: Solicitud de cita

**Como** paciente, **quiero** consultar horas disponibles y solicitar una cita con un profesional de la especialidad requerida, **para** recibir atención en un horario conveniente.

Criterios de aceptación:

- Se muestran únicamente horarios disponibles.
- La cita queda asociada al paciente, profesional y especialidad.
- El sistema impide reservar una hora ocupada.
- El paciente recibe una confirmación observable.

### HU-02: Asignación de citas

**Como** recepcionista, **quiero** visualizar la disponibilidad de los profesionales, **para** asignar citas rápidamente y evitar conflictos de horario.

Criterios de aceptación:

- Se puede filtrar por fecha, profesional y especialidad.
- Se diferencian horarios libres y ocupados.
- La disponibilidad se valida nuevamente al confirmar.
- No se permiten solapamientos para un mismo profesional.

### HU-03: Registro de pago o bono

**Como** recepcionista, **quiero** registrar el pago o bono asociado a una cita, **para** confirmar la atención y mantener actualizado su estado financiero.

Criterios de aceptación:

- El pago queda vinculado a una cita existente.
- Se registra tipo, monto, fecha y responsable.
- El número de bono es obligatorio cuando corresponda.
- La operación queda auditada.

### HU-04: Historial y atención clínica

**Como** profesional médico, **quiero** consultar el historial clínico autorizado y registrar una nueva atención, **para** tomar decisiones clínicas informadas y mantener continuidad del tratamiento.

Criterios de aceptación:

- El backend valida la relación asistencial.
- El historial se presenta cronológicamente.
- Es posible registrar atención, diagnósticos y tratamientos dentro de una transacción.
- La consulta y la modificación quedan auditadas.

---

## 7. Modelo de datos mínimo

### Entidades

- `User`
- `Role`
- `UserRole`
- `Patient`
- `Professional`
- `Specialty`
- `ProfessionalSpecialty`
- `ProfessionalSchedule`
- `Appointment`
- `Payment`
- `ClinicalCare`
- `Diagnosis`
- `Treatment`
- `AuditEvent`

### Relaciones

```text
User N:M Role
User 0:1 Patient
User 0:1 Professional
Professional N:M Specialty
Professional 1:N ProfessionalSchedule
Patient 1:N Appointment
Professional 1:N Appointment
Specialty 1:N Appointment
Appointment 1:N Payment
Appointment 0:1 ClinicalCare
Patient 1:N ClinicalCare
Professional 1:N ClinicalCare
ClinicalCare 1:N Diagnosis
ClinicalCare 1:N Treatment
User 1:N AuditEvent
```

### Diagrama relacional Mermaid

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : grants
    USER ||--o| PATIENT : enables
    USER ||--o| PROFESSIONAL : represents
    PROFESSIONAL ||--o{ PROFESSIONAL_SPECIALTY : practices
    SPECIALTY ||--o{ PROFESSIONAL_SPECIALTY : includes
    PROFESSIONAL ||--o{ PROFESSIONAL_SCHEDULE : defines
    PATIENT ||--o{ APPOINTMENT : requests
    PROFESSIONAL ||--o{ APPOINTMENT : attends
    SPECIALTY ||--o{ APPOINTMENT : classifies
    APPOINTMENT ||--o{ PAYMENT : receives
    APPOINTMENT ||--o| CLINICAL_CARE : originates
    PATIENT ||--o{ CLINICAL_CARE : receives
    PROFESSIONAL ||--o{ CLINICAL_CARE : performs
    CLINICAL_CARE ||--o{ DIAGNOSIS : contains
    CLINICAL_CARE ||--o{ TREATMENT : prescribes
    USER ||--o{ AUDIT_EVENT : generates
```

### Reglas de integridad indispensables

- Correos internos únicos.
- Identificador de paciente único.
- Registro profesional único.
- Fecha final de cita posterior a fecha inicial.
- Monto de pago mayor o igual a cero.
- No permitir citas activas solapadas para un mismo profesional.
- Una cita genera como máximo una atención clínica.
- No eliminar pagos: usar estados como `ANULADO` o `REEMBOLSADO`.
- No sobrescribir el historial clínico sin conservar trazabilidad.
- Usar fechas con zona horaria (`TIMESTAMPTZ`) en eventos.

---

## 8. API REST mínima

Prefijo obligatorio: `/api/v1`.

| ID | Método | Ruta | Propósito |
|---|---|---|---|
| API-01 | POST | `/api/v1/auth/login` | Iniciar sesión |
| API-02 | POST | `/api/v1/patients` | Registrar paciente |
| API-03 | GET | `/api/v1/patients/:patientId` | Consultar paciente según permisos |
| API-04 | PATCH | `/api/v1/patients/:patientId` | Actualizar datos autorizados |
| API-05 | GET | `/api/v1/professionals/:professionalId/availability` | Consultar disponibilidad |
| API-06 | POST | `/api/v1/appointments` | Crear cita |
| API-07 | GET | `/api/v1/appointments` | Consultar agenda con filtros |
| API-08 | PATCH | `/api/v1/appointments/:appointmentId/reschedule` | Reprogramar cita |
| API-09 | PATCH | `/api/v1/appointments/:appointmentId/status` | Cambiar estado de cita |
| API-10 | POST | `/api/v1/appointments/:appointmentId/payments` | Registrar pago o bono |
| API-11 | POST | `/api/v1/appointments/:appointmentId/clinical-care` | Registrar atención clínica |
| API-12 | GET | `/api/v1/patients/:patientId/clinical-history` | Consultar historial clínico autorizado |
| API-13 | GET | `/api/v1/audit-events` | Consultar auditoría |
| API-14 | GET | `/api/v1/health` | Comprobar salud del backend |

### Convenciones HTTP

- `200 OK`: consulta o actualización exitosa.
- `201 Created`: recurso creado.
- `204 No Content`: operación exitosa sin cuerpo.
- `400 Bad Request`: formato o transición inválida.
- `401 Unauthorized`: sesión ausente o inválida.
- `403 Forbidden`: usuario autenticado sin permiso.
- `404 Not Found`: recurso inexistente o no visible para el actor.
- `409 Conflict`: duplicidad, solapamiento o conflicto de estado.
- `422 Unprocessable Entity`: regla de negocio incumplida, si el equipo adopta este código.
- `500 Internal Server Error`: error inesperado sin exponer datos internos.

### Formato de error

```json
{
  "statusCode": 409,
  "code": "APPOINTMENT_OVERLAP",
  "message": "El profesional ya tiene una cita en ese intervalo.",
  "details": [],
  "traceId": "uuid"
}
```

---

## 9. OpenAPI y Swagger

### Requisitos obligatorios

- Instalar `@nestjs/swagger`.
- Publicar Swagger UI en `/api/docs` solo en entornos autorizados.
- Publicar el documento JSON en `/api/docs-json` o exportarlo durante CI.
- Definir autenticación Bearer en el documento.
- Agrupar endpoints con etiquetas por módulo.
- Documentar DTOs, parámetros, filtros, respuestas exitosas y errores.
- Incluir ejemplos sintéticos, nunca datos reales.
- Mantener la versión de API en la URL y en el documento OpenAPI.
- Validar el contrato OpenAPI en CI.
- Exportar una copia versionada a `docs/api/openapi.json` o `docs/api/openapi.yaml`.

### Configuración de referencia para NestJS

```ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning();

  const config = new DocumentBuilder()
    .setTitle('Clínica Horizonte API')
    .setDescription('API REST para la plataforma Clínica Horizonte')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config);

  if (process.env.SWAGGER_ENABLED === 'true') {
    SwaggerModule.setup('api/docs', app, documentFactory, {
      jsonDocumentUrl: 'api/docs-json'
    });
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
```

### Reglas para controladores y DTOs

Usar, según corresponda:

```ts
@ApiTags('appointments')
@ApiBearerAuth()
@ApiOperation({ summary: 'Crear una cita' })
@ApiParam(...)
@ApiQuery(...)
@ApiBody(...)
@ApiCreatedResponse(...)
@ApiBadRequestResponse(...)
@ApiUnauthorizedResponse(...)
@ApiForbiddenResponse(...)
@ApiConflictResponse(...)
@ApiProperty(...)
@ApiPropertyOptional(...)
```

### Política de contrato

- Si cambia un DTO público, actualizar OpenAPI y las pruebas de contrato.
- Evitar cambios incompatibles dentro de `/api/v1`.
- Un cambio incompatible requiere `/api/v2` o una estrategia de transición documentada.
- El frontend debe consumir tipos generados desde OpenAPI o mantener tipos equivalentes verificados en CI.

---

## 10. Docker y ejecución local

### Servicios esperados en `docker-compose.yml`

```yaml
services:
  frontend:
    build: ./frontend
    environment:
      API_URL: http://backend:3000
    depends_on:
      backend:
        condition: service_healthy

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@database:5432/${POSTGRES_DB}
      SWAGGER_ENABLED: "true"
    depends_on:
      database:
        condition: service_healthy

  database:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Reglas Docker

- Un Dockerfile por aplicación.
- Construcciones multi-stage para frontend y backend.
- Ejecutar contenedores con usuarios no privilegiados si la imagen lo permite.
- No copiar `.env`, `.git`, pruebas innecesarias o secretos a las imágenes finales.
- Añadir `.dockerignore` en cada aplicación.
- Añadir `healthcheck` al backend y a PostgreSQL.
- Usar nombres de servicio Docker para comunicación interna, nunca `localhost` entre contenedores.
- Persistir PostgreSQL mediante volumen.
- Fijar versiones mayores de imágenes y dependencias críticas.
- Ejecutar migraciones de base de datos de manera controlada antes de servir tráfico.

### Comandos operativos

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=200 backend
docker compose down
```

No ejecutar `docker compose down -v` salvo que se quiera eliminar explícitamente la base de datos local.

---

## 11. Seguridad y privacidad

### Controles mínimos

- Hash de contraseñas con Argon2id o alternativa aprobada.
- Cookies `HttpOnly`, `Secure` y `SameSite` cuando Astro maneje la sesión.
- Tokens de acceso de corta duración y estrategia documentada de renovación o revocación.
- RBAC y validaciones contextuales, por ejemplo, relación entre profesional y paciente.
- Validación global de DTOs en NestJS.
- Cabeceras de seguridad y CORS restrictivo.
- Limitación de intentos de autenticación.
- Secretos fuera del repositorio y de las imágenes.
- TLS/HTTPS en ambientes desplegados.
- Sanitización de logs.
- Auditoría de las acciones sensibles.
- Backups cifrados y restauración probada.
- Principio de mínimo privilegio para soporte externo y cuentas de infraestructura.

### Datos prohibidos en logs

- Contraseñas y hashes.
- Tokens y cookies.
- Fichas o descripciones clínicas completas.
- Resultados de exámenes completos.
- Datos financieros completos.
- Cuerpos completos de solicitudes sensibles.

---

## 12. Migración desde el sistema anterior

### Flujo

```text
Exportar -> Perfilar -> Mapear -> Limpiar -> Transformar -> Importar -> Validar -> Conciliar
```

### Entregables

- Inventario de fuentes antiguas.
- Matriz `campo_origen -> campo_destino -> transformación -> validación`.
- Copia de seguridad previa.
- Scripts idempotentes cuando sea viable.
- Informe de registros aceptados, rechazados, duplicados y pendientes de revisión.
- Validación de cantidades y relaciones.
- Estrategia de reversión.
- Decisión documentada sobre el retiro del sistema anterior.

### Orden sugerido

1. Roles y usuarios autorizados.
2. Especialidades y profesionales.
3. Pacientes.
4. Horarios.
5. Citas históricas y futuras.
6. Atenciones, diagnósticos y tratamientos.
7. Pagos y bonos.
8. Validación y conciliación.

---

## 13. Backlog por épicas

### EP-01 Seguridad y acceso — Alta

- Autenticación.
- Autorización por roles.
- Gestión de sesiones.
- Auditoría.
- Acceso temporal de soporte.

### EP-02 Migración y continuidad — Alta

- Análisis del sistema anterior.
- Migración de pacientes.
- Migración clínica y administrativa.
- Contenedor temporal de migración.
- Validación y reversión.

### EP-03 Gestión de pacientes — Alta

- Registro.
- Consulta.
- Actualización.
- Búsqueda y paginación.

### EP-04 Agenda y citas — Alta

- Disponibilidad médica.
- Creación.
- Reprogramación.
- Cancelación.
- Estados y reglas de transición.

### EP-05 Gestión clínica — Alta

- Historial clínico.
- Atención.
- Diagnósticos.
- Tratamientos.

### EP-06 Pagos y bonos — Alta

- Registro.
- Consulta.
- Anulación y reembolso trazables.

### EP-07 Infraestructura y respaldo — Alta

- Dockerización.
- Docker Compose.
- Health checks.
- Backups y restauración.
- Preparación para AWS.

### EP-08 Portal del paciente — Media

- Acceso del paciente.
- Solicitud de cita.
- Gestión de citas propias.

### EP-09 Notificaciones y documentos — Media

- Confirmación, reprogramación y cancelación.
- Emisión y almacenamiento protegido de documentos.

### EP-10 Reportes y soporte — Media

- Reportes administrativos.
- Panel técnico.
- Logs sanitizados.

### EP-11 Integraciones e interoperabilidad — Futura

- Integraciones externas.
- Contratos de intercambio.
- Interoperabilidad clínica.

### EP-12 Métricas y accesibilidad — Futura

- Métricas operativas.
- Paneles.
- Accesibilidad y pruebas de uso.

---

## 14. Plan de implementación por fases

### Fase 0: Descubrimiento y base del repositorio

- Inspeccionar repositorio y documentar estado actual.
- Crear ADR inicial de arquitectura.
- Crear estructura del monorepo o repositorio coordinado.
- Añadir `.env.example`, linters, formateadores y scripts comunes.
- Crear Dockerfiles y Compose inicial.
- Añadir `/api/v1/health`.

**Salida verificable:** los tres contenedores arrancan y el backend responde saludablemente.

### Fase 1: Persistencia, autenticación y OpenAPI

- Modelar usuarios, roles y asignaciones.
- Configurar Prisma y migración inicial.
- Implementar login y autorización.
- Habilitar Swagger UI y exportación OpenAPI.
- Crear pruebas unitarias y e2e de autenticación.

**Salida verificable:** login funcional, ruta protegida y contrato OpenAPI válido.

### Fase 2: Pacientes y migración inicial

- Implementar CRUD autorizado de pacientes.
- Añadir búsqueda y paginación.
- Crear plantilla del proceso de migración.
- Importar un conjunto sintético de prueba.
- Auditar consulta y modificación.

**Salida verificable:** pacientes persistidos, visibles según rol y migración repetible en pruebas.

### Fase 3: Profesionales, especialidades y disponibilidad

- Modelar profesionales, especialidades y horarios.
- Implementar disponibilidad.
- Añadir reglas de fechas y duración.
- Pruebas de zonas horarias y límites.

**Salida verificable:** disponibilidad correcta para una fecha, profesional y especialidad.

### Fase 4: Citas

- Crear, consultar, reprogramar y cancelar.
- Definir máquina de estados.
- Rechazar solapamientos.
- Auditar operaciones.
- Integrar panel de recepción.

**Salida verificable:** no es posible crear citas activas superpuestas para un profesional.

### Fase 5: Pagos y bonos

- Modelar movimientos financieros.
- Registrar pago, bono, anulación y reembolso.
- Proteger permisos.
- Auditar operaciones.

**Salida verificable:** cada movimiento queda asociado a una cita y conserva historial.

### Fase 6: Gestión clínica

- Historial autorizado.
- Registro transaccional de atención, diagnósticos y tratamientos.
- Control contextual de acceso.
- Auditoría clínica.

**Salida verificable:** solo el profesional autorizado puede consultar y registrar la atención correspondiente.

### Fase 7: Respaldo, observabilidad y endurecimiento

- Automatizar backups.
- Probar restauración.
- Sanitizar logs.
- Añadir métricas y alertas básicas.
- Ejecutar pruebas de seguridad y carga definidas por el equipo.

**Salida verificable:** restauración documentada y ejecutada con datos sintéticos.

### Fase 8: Funciones de prioridad media y futura

- Portal del paciente.
- Notificaciones.
- Documentos.
- Reportes.
- Integraciones.
- Métricas y accesibilidad.

---

## 15. Estrategia de pruebas

### Unitarias

- Servicios de dominio.
- Validaciones de DTO.
- Reglas de transición.
- Cálculo de disponibilidad.
- Políticas de autorización.

### Integración

- Repositorios y PostgreSQL.
- Migraciones Prisma.
- Restricciones de integridad.
- Transacciones clínicas.
- Auditoría.

### End-to-end

- Login y permisos.
- Registro y consulta de paciente.
- Crear, reprogramar y cancelar cita.
- Registrar pago.
- Registrar atención clínica.
- Denegar accesos indebidos.

### Contrato OpenAPI

- Generar el documento durante CI.
- Validar su sintaxis.
- Detectar cambios incompatibles.
- Verificar que los endpoints públicos estén documentados.
- Verificar que las respuestas declaradas coincidan con las pruebas e2e.

### Docker

- Construir imágenes desde cero.
- Levantar Compose en un entorno limpio.
- Ejecutar migraciones.
- Verificar health checks.
- Reiniciar servicios y comprobar persistencia.

---

## 16. Definition of Done

Una tarea no está terminada hasta cumplir lo aplicable:

- [ ] Requisito y criterios de aceptación satisfechos.
- [ ] Código tipado, formateado y sin errores de lint.
- [ ] Validación de entrada implementada.
- [ ] Autenticación y autorización verificadas.
- [ ] Migración de base de datos incluida cuando corresponde.
- [ ] Operaciones sensibles auditadas.
- [ ] Endpoint documentado en OpenAPI.
- [ ] Ejemplos OpenAPI usan datos sintéticos.
- [ ] Pruebas unitarias agregadas o actualizadas.
- [ ] Pruebas de integración o e2e agregadas cuando aplica.
- [ ] `docker compose build` exitoso.
- [ ] `docker compose up` deja servicios saludables.
- [ ] No existen secretos ni datos clínicos reales en Git o logs.
- [ ] Documentación y ADR actualizados.
- [ ] Cambio compatible con `/api/v1` o ruptura documentada.
- [ ] Evidencia de comandos de verificación registrada.

---

## 17. Comandos de verificación para el agente

El agente debe adaptar estos comandos a los scripts reales del repositorio y no asumir que existen sin revisar `package.json`.

```bash
# Configuración Docker
docker compose config

# Construcción
docker compose build

# Arranque
docker compose up -d

# Estado
docker compose ps

# Backend
cd backend
npm run lint
npm run test
npm run test:e2e
npm run build
npx prisma validate
npx prisma migrate status

# Frontend
cd ../frontend
npm run lint
npm run test
npm run build

# Contrato
# Ejecutar el script real definido por el proyecto para exportar y validar OpenAPI.
```

---

## 18. Protocolo de trabajo para agentes

### Antes de programar

1. Leer `README.md`, este plan y los ADR.
2. Ejecutar `git status` y no sobrescribir cambios ajenos.
3. Revisar scripts disponibles.
4. Identificar módulo, entidades y endpoints afectados.
5. Escribir un plan corto de archivos y verificaciones.

### Durante la implementación

1. Modificar primero el dominio y contratos.
2. Crear o actualizar la migración.
3. Implementar autorización y auditoría.
4. Actualizar OpenAPI.
5. Implementar frontend contra el contrato.
6. Añadir pruebas.
7. Ejecutar validaciones incrementales.

### Antes de entregar

1. Revisar el diff completo.
2. Eliminar código temporal, logs de depuración y secretos.
3. Ejecutar Definition of Done.
4. Informar cambios, pruebas y riesgos.
5. No declarar éxito si algún control crítico falla.

### Restricciones para autonomía

El agente puede:

- crear módulos, DTOs, controladores, servicios y pruebas;
- crear migraciones y datos sintéticos;
- actualizar Docker y documentación;
- corregir errores encontrados dentro del alcance.

El agente no debe, sin una decisión explícita documentada:

- cambiar el stack aprobado;
- convertir el sistema en microservicios;
- eliminar migraciones aplicadas;
- borrar datos persistentes;
- desactivar controles de seguridad para aprobar pruebas;
- exponer PostgreSQL públicamente;
- otorgar acceso clínico global al soporte externo;
- introducir dependencias innecesarias;
- hacer cambios incompatibles en `/api/v1`.

---

## 19. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de datos durante migración | Backups, ensayo previo, conciliación y reversión |
| Datos duplicados o incompatibles | Mapeo, normalización, identificadores únicos e informe de rechazo |
| Doble reserva | Validación transaccional y restricción reforzada en PostgreSQL |
| Acceso indebido a fichas | RBAC, autorización contextual y auditoría |
| Filtración mediante logs | Sanitización, minimización y pruebas |
| Interrupción del servicio | Health checks, backups, restauración y despliegue progresivo |
| Desalineación frontend/backend | OpenAPI versionado y pruebas de contrato |
| Deriva entre entornos | Docker, variables documentadas y CI reproducible |
| Secretos en repositorio | `.env.example`, secretos externos y escaneo automatizado |
| Dependencia excesiva del agente | ADR, pruebas, documentación y revisión de cambios |

---

## 20. Fuentes técnicas de referencia

- [Documentación oficial de OpenAPI en NestJS](https://docs.nestjs.com/openapi/introduction)
- [Integración Swagger en NestJS](https://docs.nestjs.com/recipes/swagger)
- [Documentación de Astro con Docker](https://docs.astro.build/en/recipes/docker/)
- [Renderizado bajo demanda de Astro](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Restricciones de PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

## 21. Primer objetivo ejecutable para el agente

Implementar la **Fase 0** sin desarrollar todavía lógica clínica:

1. inspeccionar el repositorio;
2. crear o ajustar la estructura acordada;
3. contenerizar Astro SSR, NestJS y PostgreSQL;
4. configurar red, volumen, variables y health checks;
5. añadir `/api/v1/health`;
6. inicializar Swagger/OpenAPI en NestJS;
7. demostrar que `docker compose up -d` deja los servicios saludables;
8. documentar comandos, decisiones y problemas encontrados.

El agente debe detener el avance a la Fase 1 si la base Docker, la salud del backend o la generación del contrato OpenAPI no funcionan de forma reproducible.
