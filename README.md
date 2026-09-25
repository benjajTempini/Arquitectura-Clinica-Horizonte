# Arquitectura-Clinica-Horizonte

Repositorio base de la nueva plataforma de Clínica Horizonte, diseñada para desarrollar **frontend y backend en conjunto**, con una arquitectura documentada y trazable para facilitar el trabajo asistido por IA.

## Stack tecnológico objetivo

- **Frontend:** AstroJS + React
- **Backend:** NestJS (API REST) + Prisma ORM
- **Base de datos:** PostgreSQL
- **Infraestructura AWS:** S3, CloudFront, ECS Fargate, RDS, Secrets Manager y CloudWatch
- **Despliegue:** Contenedores Docker

## Actores y roles

- **Personal médico:** consulta antecedentes clínicos y registra atenciones de pacientes autorizados.
- **Personal administrativo:** gestiona información administrativa y financiera.
- **Recepcionista:** coordina atención de pacientes y gestiona citas.
- **Soporte técnico externo:** diagnostica y soluciona problemas técnicos de la plataforma.
- **Paciente:** solicita y gestiona horas médicas.
- **Administrador del sistema:** administra usuarios, permisos y configuraciones.

## Historias de usuario priorizadas

1. Como paciente, quiero consultar horas disponibles y solicitar cita por especialidad.
2. Como recepcionista, quiero ver un panel centralizado de disponibilidad y estado de horas.
3. Como recepcionista, quiero registrar pago o bono en la cita del paciente.
4. Como profesional médico, quiero consultar un historial clínico cronológico y actualizado.
5. Como administrador, quiero auditar accesos y modificaciones sobre información sensible.
6. Como responsable de migración, quiero importar pacientes, citas y antecedentes válidos.
7. Como soporte externo, quiero acceso temporal a métricas y logs técnicos autorizados.
8. Como administrador, quiero monitorear servicios y contar con backups recuperables.

## Estructura inicial propuesta del repositorio

```text
.
├── frontend/            # Astro + React
├── backend/             # NestJS + Prisma
├── infra/               # Docker y despliegue en AWS
├── docs/                # Arquitectura y decisiones
├── docker-compose.yml   # Entorno local integrado
└── README.md
```

## Documentación principal

- [Arquitectura de referencia](docs/architecture.md)
