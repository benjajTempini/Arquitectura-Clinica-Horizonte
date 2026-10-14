#!/bin/bash
# ==============================================================================
# Script de Inicialización SSL Certbot & Nginx para Clínica Horizonte
# Dominios:
#   - api-clinica-horizonte.benjamincodes.cl
#   - clinica-horizonte.benjamincodes.cl
# Compatible con: Amazon Linux 2023, Ubuntu 22.04/24.04, Debian
# ==============================================================================

set -euo pipefail

DOMAINS=("api-clinica-horizonte.benjamincodes.cl" "clinica-horizonte.benjamincodes.cl")
RSA_KEY_SIZE=4096
DATA_PATH="./certbot"
EMAIL="contacto@benjamincodes.cl"
STAGING=0 # Cambiar a 1 si deseas probar la emisión sin consumir cuota de Let's Encrypt

echo "======================================================================"
echo " CLÍNICA HORIZONTE — Inicialización SSL con Let's Encrypt (Certbot)"
echo " Dominios objetivo:"
for d in "${DOMAINS[@]}"; do
  echo "   * $d"
done
echo "======================================================================"

# 1. Comprobar Docker y Compose
if ! command -v docker &> /dev/null; then
  echo "[ERROR] Docker no está instalado en el sistema."
  exit 1
fi

if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo "[ERROR] Docker Compose no está instalado."
  exit 1
fi

echo "[Paso 1/5] Creando directorios requeridos por Certbot..."
mkdir -p "$DATA_PATH/conf/live"
mkdir -p "$DATA_PATH/www"

echo "[Paso 2/5] Comprobando certificados SSL previos..."
NEED_CERTS=0
for domain in "${DOMAINS[@]}"; do
  if [ ! -f "$DATA_PATH/conf/live/$domain/fullchain.pem" ]; then
    NEED_CERTS=1
    break
  fi
done

if [ "$NEED_CERTS" -eq 1 ]; then
  echo "[Paso 3/5] Generando certificados autofirmados temporales (Dummy SSL)..."
  for domain in "${DOMAINS[@]}"; do
    domain_dir="$DATA_PATH/conf/live/$domain"
    mkdir -p "$domain_dir"
    if [ ! -f "$domain_dir/fullchain.pem" ]; then
      openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$domain_dir/privkey.pem" \
        -out "$domain_dir/fullchain.pem" \
        -subj "/CN=localhost"
    fi
  done

  echo "[Paso 4/5] Levantando Nginx temporalmente para el desafío ACME HTTP-01..."
  $COMPOSE_CMD up -d nginx

  echo "[Paso 5/5] Eliminando certificados temporales y solicitando certificados oficiales..."
  for domain in "${DOMAINS[@]}"; do
    rm -rf "$DATA_PATH/conf/live/$domain"
  done

  EMAIL_ARG="--register-unsafely-without-email"
  if [ -n "$EMAIL" ]; then
    EMAIL_ARG="--email $EMAIL"
  fi

  STAGING_ARG=""
  if [ "$STAGING" -ne 0 ]; then
    STAGING_ARG="--staging"
  fi

  for domain in "${DOMAINS[@]}"; do
    echo ">>> Solicitando certificado Let's Encrypt para: $domain"
    $COMPOSE_CMD run --rm --entrypoint "\
      certbot certonly --webroot -w /var/www/certbot \
        $STAGING_ARG \
        $EMAIL_ARG \
        -d $domain \
        --rsa-key-size $RSA_KEY_SIZE \
        --agree-tos \
        --force-renewal \
        --non-interactive" certbot
  done

  echo ">>> Recargando Nginx para activar los certificados SSL definitivos..."
  $COMPOSE_CMD exec nginx nginx -s reload
else
  echo "[INFO] Los certificados SSL para ambos dominios ya existen. Omitiendo emisión."
fi

echo "======================================================================"
echo " ¡Despliegue y configuración SSL finalizada con éxito!"
echo " Frontend Web: https://clinica-horizonte.benjamincodes.cl"
echo " Backend API:  https://api-clinica-horizonte.benjamincodes.cl/api/v1/health"
echo " Swagger UI:   https://api-clinica-horizonte.benjamincodes.cl/api/docs"
echo "======================================================================"

