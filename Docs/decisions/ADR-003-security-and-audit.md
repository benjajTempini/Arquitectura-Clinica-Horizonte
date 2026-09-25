# ADR-003: Seguridad, Roles RBAC, Sanitización y Auditoría Inmutable

## Estado
Aprobado

## Contexto
Por normativas de salud y confidencialidad médica, la plataforma debe restringir el acceso según roles (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `ADMINISTRATIVE`, `EXTERNAL_SUPPORT`, `PATIENT`), registrar eventos sensibles y prohibir la inclusión de datos clínicos o secretos en logs.

## Decisión
1. **Autenticación**: JWT con firma HMAC SHA-256 (o asimétrica en prod) con expiración corta (8 horas para turnos).
2. **Autorización**: Decorador `@Roles(...)` y `RolesGuard` en NestJS evaluando los roles del usuario autenticado.
3. **Auditoría**: Entidad `AuditEvent` con registro de usuario, acción (`LOGIN`, `CREATE`, `UPDATE`, `CANCEL`, `VIEW_CLINICAL`, etc.), recurso, ID de recurso, IP y metadata sanitizada.
4. **Sanitización de Logs**: Filtro global y logging interceptor que omiten campos como contraseñas, tokens, tarjetas, o notas clínicas completas de las salidas stdout.
5. **Soporte Externo**: Acceso temporal restringido exclusivamente a endpoints de salud (`/api/v1/health`), métricas y eventos de auditoría sanitizados, sin acceso a fichas clínicas de pacientes.
