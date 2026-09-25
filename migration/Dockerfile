# Dockerfile para el contenedor temporal de migración
FROM node:22-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

CMD ["npm", "start"]
