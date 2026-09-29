# Guía de Ejecución y Desarrollo Local (Sin Docker) — Clínica Horizonte

Esta guía está diseñada para que tú y tu equipo puedan levantar, desarrollar, probar y modificar tanto el **Backend (NestJS)** como el **Frontend (Astro SSR + React)** directamente en sus computadoras locales sin depender de Docker. Esto permite contar con **Hot-Reloading** instantáneo (los cambios se reflejan al guardar sin esperar builds de imágenes).

---

## 1. Requisitos Previos

Asegúrate de tener instalado en tu computadora:

1. **Node.js:** Versión 20 o 22 LTS ([nodejs.org](https://nodejs.org/)).
   - Verificar en terminal: `node -v` y `npm -v`.
2. **PostgreSQL:** Versión 15, 16 o 17 corriendo en tu máquina local.
   - En Windows: PostgreSQL instalado con pgAdmin o servicio de Windows.
   - Si tienes Docker y solo quieres correr la base de datos sin levantar todo el stack:
     ```bash
     docker compose up -d database
     ```
   - O una instancia de PostgreSQL en la nube (ej. Supabase, Neon o RDS).

---

## 2. Configuración de Variables de Entorno (`.env`)

Tanto en la raíz del proyecto como en `clinica-horizonte-api/` dispones de archivos `.env`. 

Si acabas de clonar el repositorio, copia el archivo de plantilla:
- **Windows (PowerShell):**
  ```powershell
  copy .env.example .env
  copy clinica-horizonte-api/.env.example clinica-horizonte-api/.env
  ```
- **Linux / macOS:**
  ```bash
  cp .env.example .env
  cp clinica-horizonte-api/.env.example clinica-horizonte-api/.env
  ```

### Configuración de la Base de Datos Local
Abre el archivo `.env` y asegúrate de que `DATABASE_URL` apunte a tu PostgreSQL local con el usuario y contraseña que configuraste al instalar PostgreSQL:

```ini
# Formato: postgresql://<USUARIO>:<PASSWORD>@localhost:5432/<NOMBRE_BD>?schema=public
DATABASE_URL=postgresql://clinica_admin:ClinicaHorizonteSecurePass2026!@localhost:5432/clinica_horizonte?schema=public
```

> **Tip:** Si tu PostgreSQL local usa el usuario por defecto `postgres` y contraseña `postgres` (o tu clave personal), simplemente cambia esa línea:
> `DATABASE_URL=postgresql://postgres:tu_clave@localhost:5432/clinica_horizonte?schema=public`

Asegúrate de haber creado la base de datos `clinica_horizonte` en tu PostgreSQL (mediante pgAdmin, DBeaver o consola `psql -U postgres -c "CREATE DATABASE clinica_horizonte;"`).

---

## 3. Instalación de Dependencias

Ejecuta la instalación de paquetes tanto en el backend como en el frontend. Puedes hacerlo desde la raíz:

```bash
# 1. Instalar backend
npm --prefix clinica-horizonte-api install

# 2. Instalar frontend
npm --prefix clinica-horizonte-app install
```

O entrando a cada carpeta individualmente:
```bash
cd clinica-horizonte-api && npm install && cd ..
cd clinica-horizonte-app && npm install && cd ..
```

---

## 4. Inicializar la Base de Datos (Migraciones y Semillas)

Antes de levantar el backend, debemos aplicar las migraciones para crear las 14 tablas en PostgreSQL e insertar los datos iniciales de prueba (roles, médicos, especialidades y pacientes).

Desde la carpeta raíz del proyecto, ejecuta:

```bash
# A. Generar el cliente de Prisma
npm --prefix clinica-horizonte-api run prisma:generate

# B. Aplicar las migraciones a PostgreSQL
npx --prefix clinica-horizonte-api prisma migrate deploy

# C. Sembrar los datos sintéticos (cuentas de prueba, doctores y especialidades)
npm --prefix clinica-horizonte-api run prisma:seed
```

Verás mensajes confirmando que los roles, usuarios y especialidades fueron insertados con éxito.

---

## 5. Levantar los Servicios en Modo Desarrollo (Hot-Reload)

Para trabajar cómodamente, abre **dos terminales** diferentes:

### Terminal 1: Backend API (NestJS)
Desde la raíz del proyecto:
```bash
npm run dev:backend
```
*(O entrando a `cd clinica-horizonte-api` y ejecutando `npm run start:dev`)*

- Escuchará en: `http://localhost:3000`
- Swagger UI interactivo: `http://localhost:3000/api/docs`
- Endpoint de salud: `http://localhost:3000/api/v1/health`
- Cada vez que guardes cambios en archivos `.ts` dentro de `src/`, el servidor se reiniciará automáticamente en menos de 2 segundos.

### Terminal 2: Frontend Web (Astro SSR + React)
Desde la raíz del proyecto:
```bash
npm run dev:frontend
```
*(O entrando a `cd clinica-horizonte-app` y ejecutando `npm run dev`)*

- Escuchará en: `http://localhost:4321`
- Cada vez que modifiques componentes `.tsx`, páginas `.astro` o estilos Tailwind, el navegador se actualizará automáticamente en tiempo real (Fast Refresh).

---

## 6. Cuentas de Acceso para Pruebas en el Frontend

Una vez que abras `http://localhost:4321` en tu navegador, ingresa a `/login` con cualquiera de estas cuentas preconfiguradas:

**Contraseña para todas las cuentas:** `Clinica2026!`

| Rol | Correo Electrónico | Contraseña | ¿Qué puedes probar con este rol? |
|---|---|---|---|
| **Administrador** | `admin@clinicahorizonte.cl` | `Clinica2026!` | Auditoría completa, supervisión y gestión total. |
| **Recepción** | `recepcion@clinicahorizonte.cl` | `Clinica2026!` | Agendar citas, ver franjas de disponibilidad, cobrar en caja con Fonasa/Isapre. |
| **Médico General** | `dr.morales@clinicahorizonte.cl` | `Clinica2026!` | Ficha clínica, consulta de historial y emisión de recetas transaccionales. |
| **Pediatra** | `dra.valenzuela@clinicahorizonte.cl` | `Clinica2026!` | Atención pediátrica especializada y diagnósticos CIE-10. |
| **Soporte Técnico** | `soporte.ext@clinicahorizonte.cl` | `Clinica2026!` | Visor de auditoría técnica y métricas sanitizadas. |

---

## 7. Flujo de Trabajo Recomendado al Modificar Código

### Si modificas la lógica del Frontend:
- Los componentes interactivos están en: `clinica-horizonte-app/src/components/`
- Las rutas y páginas en: `clinica-horizonte-app/src/pages/`
- El cliente HTTP de comunicación con la API en: `clinica-horizonte-app/src/services/api.ts`
- Guarda tu código y revisa el cambio en el navegador al instante.

### Si modificas la lógica del Backend:
- Cada módulo de dominio está organizado en su propia carpeta en `clinica-horizonte-api/src/` (`appointments`, `patients`, `payments`, `clinical-care`, `professionals`, `audit`, etc.).
- Las reglas de negocio se implementan en los archivos `.service.ts`.
- Los endpoints HTTP se definen en los archivos `.controller.ts`.
- Los contratos de datos se validan en los archivos `dto/*.dto.ts` usando `class-validator`.

### Si modificas el Modelo de Datos (Prisma):
Si necesitas agregar o cambiar campos en `clinica-horizonte-api/prisma/schema.prisma`:
1. Edita `prisma/schema.prisma`.
2. Actualiza el cliente:
   ```bash
   npm --prefix clinica-horizonte-api run prisma:generate
   ```
3. Genera una nueva migración con nombre descriptivo:
   ```bash
   cd clinica-horizonte-api
   npx prisma migrate dev --name <descripcion_del_cambio>
   cd ..
   ```
4. Actualiza el contrato OpenAPI para mantener alineada la documentación:
   ```bash
   npm run export:openapi
   ```

---

## 8. Comprobaciones y Pruebas Rápidas

Antes de compartir cambios o subirlos a Git, ejecuta:

```bash
# 1. Pruebas unitarias del backend (Jest)
npm --prefix clinica-horizonte-api run test

# 2. Compilar backend para asegurar que no hay errores de tipos
npm --prefix clinica-horizonte-api run build

# 3. Compilar frontend para verificar empaquetado de Astro y React
npm --prefix clinica-horizonte-app run build
```

---

## 9. Solución a Problemas Comunes (Troubleshooting)

### Error: `Can't reach database server at localhost:5432`
- **Causa:** El servicio de PostgreSQL no está encendido o el puerto/contraseña en `.env` no coinciden.
- **Solución:** Verifica que el servicio PostgreSQL esté activo (en Windows abre `services.msc` y busca postgresql, o inicia el contenedor con `docker compose up -d database`).

### Error: `Port 3000 / 4321 is already in use`
- **Causa:** Quedó un proceso de Node anterior escuchando en el puerto.
- **Solución en Windows (PowerShell):**
  ```powershell
  # Ver qué proceso usa el puerto 3000
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  # Ver qué proceso usa el puerto 4321
  Get-Process -Id (Get-NetTCPConnection -LocalPort 4321).OwningProcess | Stop-Process -Force
  ```

### Error: `relation "User" does not exist`
- **Causa:** Levantaste el backend sin haber aplicado las migraciones de Prisma a la base de datos.
- **Solución:** Ejecuta `npx --prefix clinica-horizonte-api prisma migrate deploy` y luego `npm --prefix clinica-horizonte-api run prisma:seed`.

### Error: `CORS error` en la consola del navegador
- **Causa:** El backend no está permitiendo peticiones desde tu frontend.
- **Solución:** Revisa que en tu archivo `.env` tengas `CORS_ORIGIN=*`.
