# Guía de Despliegue en AWS EC2 (Amazon Linux 2023) — Nginx + Certbot (SSL)

Esta guía detalla el procedimiento para aprovisionar, configurar y desplegar el sistema **Clínica Horizonte** en una instancia virtual **Amazon EC2 (AWS)** ejecutando **Amazon Linux 2023 (AL2023)** con **Docker**, **Docker Compose**, **Nginx** como Proxy Inverso y **Certbot** para certificados SSL automáticos con Let's Encrypt.

### Dominios de Producción
* **Frontend Web (Astro SSR):** `https://clinica-horizonte.benjamincodes.cl`
* **Backend API REST (NestJS):** `https://api-clinica-horizonte.benjamincodes.cl`
* **Swagger UI / OpenAPI:** `https://api-clinica-horizonte.benjamincodes.cl/api/docs`

---

## 1. Requisitos y Configuración de AWS

### Especificaciones de la Instancia EC2
- **AMI:** Amazon Linux 2023 AMI (`x86_64` o `arm64`)
- **Tipo de Instancia:** `t3.small` (2 vCPU, 2 GiB RAM) o `t3.medium` (2 vCPU, 4 GiB RAM)
- **Almacenamiento (EBS):** Mínimo 20 GB gp3

### Reglas del Security Group (Inbound Rules)
Configura en la consola de AWS las siguientes reglas de entrada para tu instancia EC2:

| Tipo | Protocolo | Puerto | Origen (Source) | Descripción |
|---|---|---|---|---|
| **SSH** | TCP | `22` | Tu IP o `0.0.0.0/0` | Acceso a terminal remota |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Desafíos ACME Let's Encrypt y redirección HTTPS |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Tráfico web cifrado TLS/SSL |

> [!NOTE]
> Los puertos internos `3000` (NestJS), `4321` (Astro) y `5432` (PostgreSQL) están aislados dentro de la red interna de Docker (`127.0.0.1` / red bridge). **No** deben abrirse públicamente en el Security Group.

### Configuración DNS (Registrador de Dominio)
En tu proveedor de DNS (Cloudflare, Route 53, Namecheap, etc.), crea dos registros **Tipo A** apuntando a la IP pública (preferentemente Elastic IP) de tu EC2:

* `clinica-horizonte.benjamincodes.cl` &rarr; `<IP_PUBLICA_EC2>`
* `api-clinica-horizonte.benjamincodes.cl` &rarr; `<IP_PUBLICA_EC2>`

---

## 2. Preparación del Servidor Amazon Linux 2023

Conéctate por SSH a la instancia:
```bash
ssh -i "tu-llave.pem" ec2-user@<IP_PUBLICA_EC2>
```

### A. Actualizar paquetes del sistema
```bash
sudo dnf update -y
```

### B. Instalar Git, Docker y OpenSSL
```bash
sudo dnf install -y git docker openssl
```

### C. Habilitar e Iniciar el Servicio Docker
```bash
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```
*(Cierra y vuelve a abrir tu sesión SSH, o ejecuta `newgrp docker` para aplicar permisos de usuario).*

### D. Instalar Docker Compose Plugin en Amazon Linux 2023
```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Crear alias global para compatibilidad con 'docker compose' y 'docker-compose'
sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
```

Verificar la instalación:
```bash
docker --version
docker compose version
```

---

## 3. Clonar el Proyecto y Variables de Entorno

### A. Clonar el Repositorio
```bash
git clone https://github.com/benjajTempini/Arquitectura-Clinica-Horizonte.git
cd Arquitectura-Clinica-Horizonte
```

### B. Crear el Archivo `.env`
```bash
cp .env.example .env
nano .env
```

Verifica las variables esenciales de producción:
```ini
NODE_ENV=production
POSTGRES_DB=clinica_horizonte
POSTGRES_USER=clinica_admin
POSTGRES_PASSWORD=ClinicaHorizonteSecurePass2026!

# Dominios y Seguridad
CORS_ORIGIN=https://clinica-horizonte.benjamincodes.cl
PUBLIC_API_URL=https://api-clinica-horizonte.benjamincodes.cl
API_URL=http://backend:3000

# Sembrado automático al iniciar
SEED_ON_STARTUP=true
SWAGGER_ENABLED=true
```

Guarda con `Ctrl + O`, `Enter` y sal con `Ctrl + X`.

---

## 4. Inicialización de Certificados SSL y Nginx

Para evitar el error de Nginx al arrancar sin certificados previos, se incluye el script automatizado `init-letsencrypt.sh`:

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

### ¿Qué hace este script de forma transparente?
1. Crea los directorios compartidos `./certbot/conf` y `./certbot/www`.
2. Genera certificados temporales autofirmados (dummy SSL) para permitir el arranque inicial de Nginx.
3. Levanta Nginx respondiendo al desafío HTTP-01 de Let's Encrypt (`/.well-known/acme-challenge/`).
4. Ejecuta el contenedor `certbot` solicitando los certificados oficiales para:
   - `api-clinica-horizonte.benjamincodes.cl`
   - `clinica-horizonte.benjamincodes.cl`
5. Recarga Nginx en caliente activando el cifrado HTTPS definitivo.

---

## 5. Levantar Toda la Infraestructura

Una vez emitidos los certificados, levanta todos los microservicios en segundo plano:

```bash
docker compose up --build -d
```

### Servicios en Ejecución:
* **`clinica_horizonte_db`:** PostgreSQL 17 con extensiones criptográficas.
* **`clinica_horizonte_backend`:** NestJS API REST con migraciones automáticas y seed.
* **`clinica_horizonte_frontend`:** Astro SSR + React con el nuevo diseño Blanco y Aquamarine / Modo Oscuro Teal.
* **`clinica_horizonte_nginx`:** Proxy Inverso con SSL, compresión Gzip y headers de seguridad.
* **`clinica_horizonte_certbot`:** Daemon de renovación automática de certificados cada 12 horas.

---

## 6. Verificación y Monitoreo

### A. Estado de los Contenedores
```bash
docker compose ps
```
Todos los contenedores deben figurar en estado `Up` o `Up (healthy)`.

### B. Probar Endpoints HTTPS
```bash
# Probar API NestJS cifrada
curl -I https://api-clinica-horizonte.benjamincodes.cl/api/v1/health

# Probar Frontend Astro cifrado
curl -I https://clinica-horizonte.benjamincodes.cl
```

### C. Inspección de Logs en Tiempo Real
```bash
# Logs generales
docker compose logs -f

# Logs específicos de Nginx o Certbot
docker compose logs -f nginx
docker compose logs -f certbot
```

---

## 7. Mantenimiento y Renovación de Certificados

### Renovación Automática
El contenedor `certbot` en `docker-compose.yml` revisa y renueva automáticamente los certificados dos veces al día. Nginx tiene programada una recarga periódica para adoptar los nuevos certificados sin tiempo de inactividad.

### Renovación Manual de Emergencia
Si deseas forzar una renovación o verificar el estado de los certificados:
```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### Respaldo de Base de Datos
```bash
docker compose exec -T database pg_dump -U clinica_admin clinica_horizonte > backup_$(date +%Y%m%d).sql
```
