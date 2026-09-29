#!/bin/sh
set -e

echo "=========================================================="
echo "  Clínica Horizonte API — Inicialización del Contenedor"
echo "=========================================================="

echo "[Backend] Aplicando migraciones de Prisma..."
npx prisma migrate deploy

if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "[Backend] Ejecutando sembrado inicial de datos (seed.ts)..."
  npx ts-node prisma/seed.ts || echo "[Backend] Aviso: El sembrado ya existía o falló de forma no crítica."
fi

echo "[Backend] Iniciando servicio NestJS..."
exec "$@"
