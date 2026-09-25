# -----------------------------------------------------------------------------
# Multi-stage Dockerfile para NestJS Backend - Clínica Horizonte
# -----------------------------------------------------------------------------

# Etapa 1: Dependencias y Compilación
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias completas
RUN npm ci

# Copiar código fuente y configuración
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Etapa 2: Imagen Final de Producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Usuario no privilegiado por seguridad
USER node

# Copiar dependencias de producción y cliente generado
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

# Copiar artefactos compilados desde el builder
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000

# Comprobación de salud en contenedor
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main"]
