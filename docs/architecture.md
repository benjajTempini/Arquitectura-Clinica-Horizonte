# Arquitectura de referencia - Clínica Horizonte

## 1. Objetivo

Definir una base arquitectónica común para frontend y backend, con trazabilidad de requisitos funcionales y no funcionales, preparada para ejecución en contenedores y despliegue en AWS.

## 2. Componentes principales

### Frontend (Astro + React)
- Portal de pacientes (solicitud y gestión de horas).
- Panel de recepción (agenda, reprogramaciones, pagos/bonos).
- Panel administrativo (usuarios, permisos, auditoría y estado de servicios).

### Backend (NestJS + Prisma)
- API REST por dominios: `auth`, `usuarios`, `pacientes`, `profesionales`, `citas`, `pagos`, `historial-clinico`, `auditoria`, `migracion`, `observabilidad`.
- Prisma ORM para acceso tipado a PostgreSQL.
- Control de acceso por roles y permisos.

### Base de datos (PostgreSQL)
- Entidades base: usuarios, roles, pacientes, profesionales, citas, pagos/bonos, atenciones, antecedentes clínicos y eventos de auditoría.
- Separación de datos clínicos y técnicos para restringir accesos del soporte externo.

### Infraestructura AWS
- **S3 + CloudFront:** distribución de frontend estático.
- **ECS Fargate:** ejecución de contenedores backend.
- **RDS PostgreSQL:** persistencia transaccional.
- **Secrets Manager:** gestión de credenciales y secretos.
- **CloudWatch:** métricas, logs y alertas.

## 3. Trazabilidad de historias de usuario

- **Paciente (HU1):** `GET /disponibilidad`, `POST /citas`.
- **Recepcionista (HU2, HU3):** `GET /agenda`, `PATCH /citas/:id`, `POST /citas/:id/pagos`.
- **Médico (HU4):** `GET /pacientes/:id/historial`.
- **Administrador (HU5, HU8):** `GET /auditoria`, `GET /observabilidad/estado`, `POST /backups/recovery-check`.
- **Migración (HU6):** `POST /migracion/import`.
- **Soporte externo (HU7):** `GET /observabilidad/metricas` y `GET /observabilidad/logs` con acceso temporal y acotado.

## 4. Seguridad y cumplimiento

- Autenticación centralizada y autorización por rol.
- Auditoría obligatoria para accesos/modificaciones sobre datos sensibles.
- Acceso de soporte externo restringido a telemetría técnica.
- Secretos fuera del código fuente (Secrets Manager y variables de entorno).

## 5. Contenedorización local

La solución se prepara para ejecución local en Docker Compose con servicios de `frontend`, `backend` y `postgres`.
