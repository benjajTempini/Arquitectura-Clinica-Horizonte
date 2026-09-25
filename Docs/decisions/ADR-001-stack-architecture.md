# ADR-001: Arquitectura del Stack Tecnológico y Monolito Modular

## Estado
Aprobado

## Contexto
Clínica Horizonte requiere reemplazar su sistema legacy de gestión clínica y administrativa con una solución moderna, robusta y mantenible que atienda ~180 pacientes diarios. Se requiere alta disponibilidad, contención de errores, trazabilidad estricta y bajo costo operativo sin sobrecomplejidad de microservicios en esta fase.

## Decisión
Se adopta un **Monolito Modular** distribuido en contenedores Docker:
1. **Backend**: NestJS con TypeScript estructurado por módulos de dominio (`auth`, `users`, `patients`, `professionals`, `schedules`, `appointments`, `payments`, `clinical-care`, `audit`, `health`).
2. **Persistencia**: PostgreSQL 17 con Prisma ORM y Prisma Migrate.
3. **Frontend**: Astro SSR con componentes interactivos React y Tailwind CSS, sirviendo como BFF (Backend-for-Frontend) y garantizando renderizado ágil y seguro de sesiones.
4. **Contrato de API**: OpenAPI 3.x generado automáticamente desde decoradores `@nestjs/swagger`.
5. **Orquestación**: Docker Compose para entorno local y despliegue modular en AWS ECS / Fargate.

## Consecuencias
- Desacoplamiento modular con facilidad de refactorización o extracción a microservicios a futuro si el tráfico lo amerita.
- Contrato estricto entre frontend y backend validado por TypeScript y OpenAPI.
- Seguridad reforzada evitando conexiones directas del frontend a la base de datos.
