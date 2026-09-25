# ADR-002: Modelo de Datos, Integridad Relacional y Prevención de Solapamiento

## Estado
Aprobado

## Contexto
El agendamiento médico requiere garantizar que no existan reservas dobles (solapamiento) para un mismo profesional de salud, y que los pagos y atenciones clínicas mantengan integridad referencial sin borrados destructivos (soft deletes / transiciones de estado).

## Decisión
1. **Prevención de Solapamiento**: Se implementa verificación a nivel de servicio en transacción de base de datos (`prisma.$transaction`) verificando intervalos solapados:
   `NOT (new_end <= existing_start OR new_start >= existing_end)` para citas con estados activos (`PENDING`, `CONFIRMED`, `ARRIVED`, `IN_CONSULTATION`).
2. **Ciclo de Vida de Citas**: Estados definidos: `PENDING`, `CONFIRMED`, `ARRIVED`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
3. **Inmutabilidad Clínica y Financiera**:
   - Pagos no se eliminan físicamente; pasan a `REFUNDED` o `CANCELLED`.
   - Una cita puede generar como máximo una atención clínica (`ClinicalCare`).
   - Diagnósticos y tratamientos son insertados transaccionalmente junto con la atención clínica.
4. **Tipos de Datos**: Identificadores UUID v4 y campos temporales con zona horaria (`timestamptz`).
