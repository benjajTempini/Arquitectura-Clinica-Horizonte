# -----------------------------------------------------------------------------
# Multi-stage Dockerfile para Frontend Astro SSR - Clínica Horizonte
# -----------------------------------------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY astro.config.mjs tsconfig.json tailwind.config.mjs ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 4321

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4321', (r) => process.exit(r.statusCode < 500 ? 0 : 1))"

CMD ["node", "./dist/server/entry.mjs"]
