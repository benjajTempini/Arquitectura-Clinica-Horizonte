# Guía Paso a Paso de Despliegue en AWS EC2 (Docker) — Clínica Horizonte

Esta guía detalla el procedimiento completo para aprovisionar, configurar y desplegar el sistema **Clínica Horizonte** en una instancia virtual **Amazon EC2 (AWS)** utilizando **Docker** y **Docker Compose**.

---

## 1. Requisitos de la Instancia AWS EC2

### Especificaciones Recomendadas
- **Sistema Operativo (AMI):** Ubuntu Server 24.04 LTS o 22.04 LTS (x86_64).
- **Tipo de Instancia:** `t3.small` (2 vCPU, 2 GiB RAM) o `t3.medium` (2 vCPU, 4 GiB RAM) para soportar la compilación multi-stage de imágenes Docker.
- **Almacenamiento (EBS):** Mínimo 20 GB (General Purpose SSD gp3).

### Reglas de Seguridad (Security Group — Inbound Rules)
En la consola de AWS, asegúrate de configurar las siguientes reglas de entrada (*Inbound Rules*) en el Security Group de la EC2:

| Tipo | Protocolo | Puerto | Origen (Source) | Descripción |
|---|---|---|---|---|
| **SSH** | TCP | `22` | Tu IP o `0.0.0.0/0` | Acceso remoto por terminal |
| **Custom TCP** | TCP | `4321` | `0.0.0.0/0` | Frontend web (Astro SSR + React) |
| **Custom TCP** | TCP | `3000` | `0.0.0.0/0` | Backend API REST & Swagger UI |
| **HTTP** *(Opcional)* | TCP | `80` | `0.0.0.0/0` | Si configuras Nginx como proxy inverso |

---

## 2. Preparación del Servidor EC2

Conéctate a tu instancia mediante SSH:
```bash
ssh -i "tu-llave.pem" ubuntu@<IP_PUBLICA_EC2>
```

### A. Actualizar el Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### B. Instalar Docker y Docker Compose Plugin
```bash
# Instalar paquetes requeridos
sudo apt install -y ca-certificates curl gnupg lsb-release

# Añadir clave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Configurar el repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine y Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir ejecutar docker sin sudo (opcional)
sudo usermod -aG docker $USER
newgrp docker
```

Verificar la instalación:
```bash
docker --version
docker compose version
```

---

## 3. Clonar el Proyecto y Configurar Entorno

### A. Clonar el Repositorio
```bash
git clone https://github.com/benjajTempini/Arquitectura-Clinica-Horizonte.git
cd Arquitectura-Clinica-Horizonte
```

### B. Crear el Archivo `.env`
Copia el archivo de plantilla `.env.example`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con `nano`:
```bash
nano .env
```

Configura tu IP pública de la EC2:
```ini
# En PUBLIC_API_URL coloca la IP pública de tu EC2 (o déjalo en blanco para auto-detección)
PUBLIC_API_URL=http://<IP_PUBLICA_EC2>:3000

# Permitir el origen desde cualquier host o la IP de tu EC2
CORS_ORIGIN=*

# Ejecutar automáticamente migraciones de Prisma y sembrado inicial
SEED_ON_STARTUP=true
```

Guarda los cambios con `Ctrl + O`, presiona `Enter` y sal con `Ctrl + X`.

---

## 4. Despliegue con Docker Compose

Ejecuta el comando para construir las imágenes y levantar todos los contenedores en segundo plano:
```bash
docker compose up --build -d
```

### ¿Qué hace este comando automáticamente?
1. **Base de Datos (`database`):** Levanta PostgreSQL 17, activa extensiones criptográficas (`uuid-ossp`, `pgcrypto`) y define la zona horaria `America/Santiago`.
2. **Backend (`backend`):** 
   - Compila la API NestJS.
   - Ejecuta automáticamente `prisma migrate deploy` creando las 14 tablas relacionales.
   - Ejecuta `prisma/seed.ts` insertando roles, especialidades, profesionales sintéticos y cuentas iniciales.
   - Inicia el servidor REST en el puerto `3000`.
3. **Frontend (`frontend`):** Compila e inicia la aplicación Astro SSR en el puerto `4321`.

---

## 5. Verificación y Pruebas del Despliegue

### A. Verificar el estado de los contenedores
```bash
docker compose ps
```
Los tres servicios (`clinica_horizonte_db`, `clinica_horizonte_backend` y `clinica_horizonte_frontend`) deben figurar en estado `Up (healthy)`.

### B. Probar el endpoint de salud
```bash
curl http://localhost:3000/api/v1/health
```
Debe responder:
```json
{"status":"ok","database":"healthy","service":"clinica-horizonte-api","timestamp":"..."}
```

### C. Ver registros en tiempo real (Logs)
```bash
# Ver logs de todos los servicios
docker compose logs -f

# O solo del backend
docker compose logs -f backend
```

---

## 6. Acceso al Sistema desde el Navegador

Una vez levantado en la EC2, cualquier persona de tu equipo o el docente evaluador puede ingresar directamente usando un navegador:

1. **Plataforma Web (Frontend):**
   - URL: `http://<IP_PUBLICA_EC2>:4321`
   - Vistas: Dashboard, Agenda Médica, Directorio de Pacientes, Atención Clínica, Caja y Auditoría.

2. **Documentación Swagger / OpenAPI 3.x (Backend):**
   - URL: `http://<IP_PUBLICA_EC2>:3000/api/docs`
   - Especificación JSON: `http://<IP_PUBLICA_EC2>:3000/api/docs-json`

---

## 7. Cuentas de Acceso Preconfiguradas (Seed)

Todas las cuentas sintéticas vienen configuradas con la contraseña: `Clinica2026!`

| Rol | Correo Electrónico | Contraseña | Permisos Principales |
|---|---|---|---|
| **Administrador** | `admin@clinicahorizonte.cl` | `Clinica2026!` | Acceso total, gestión de usuarios y auditoría |
| **Recepción** | `recepcion@clinicahorizonte.cl` | `Clinica2026!` | Agendamiento, cálculo de disponibilidad y cobros |
| **Médico** | `dr.morales@clinicahorizonte.cl` | `Clinica2026!` | Historial clínico, atención médica y recetas |
| **Médica** | `dra.valenzuela@clinicahorizonte.cl` | `Clinica2026!` | Atención pediátrica y consultas |
| **Soporte Externo** | `soporte.ext@clinicahorizonte.cl` | `Clinica2026!` | Monitoreo de salud y logs sanitizados |

---

## 8. Comandos Útiles de Mantenimiento

- **Detener los servicios:**
  ```bash
  docker compose down
  ```
- **Reiniciar los servicios:**
  ```bash
  docker compose restart
  ```
- **Volver a ejecutar el sembrado de datos manualmente:**
  ```bash
  docker compose exec backend npx ts-node prisma/seed.ts
  ```
- **Ejecutar el contenedor ETL de migración histórica:**
  ```bash
  docker compose --profile migration up --build migration
  ```
- **Hacer una copia de seguridad (backup) de PostgreSQL:**
  ```bash
  docker compose exec -T database pg_dump -U clinica_admin clinica_horizonte > backup_$(date +%Y%m%d).sql
  ```
- **Restaurar un respaldo:**
  ```bash
  cat backup.sql | docker compose exec -T database psql -U clinica_admin -d clinica_horizonte
  ```
