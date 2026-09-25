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

USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production

COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
