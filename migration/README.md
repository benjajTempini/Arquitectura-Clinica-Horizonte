# Contenedor y Proceso de Migración — Clínica Horizonte

Este directorio contiene las herramientas de Extracción, Transformación y Carga (ETL) para migrar la información del sistema clínico anterior hacia el nuevo esquema PostgreSQL gestionado por Prisma.

## Pipeline ETL

1. **Exportar**: Lectura de datos desde fuentes legacy (CSV, JSON o réplica SQL).
2. **Perfilar**: Análisis de campos nulos, anomalías y rangos de datos.
3. **Mapear**: Asignación de campos legacy a entidades del nuevo modelo.
4. **Limpiar**: Normalización de identificadores (RUT), teléfonos y correos.
5. **Transformar**: Mapeo de valores de catálogo a enums nuevos.
6. **Importar**: Carga idempotente (usando `ON CONFLICT` o upserts).
7. **Validar y Conciliar**: Verificación de totales y referencias cruzadas.

## Uso

### Simulación local (Dry run sin escribir en BD):
```bash
npm install
npm run migrate:dry-run
```

### Ejecución con Docker Compose:
```bash
docker compose --profile migration up migration
```
