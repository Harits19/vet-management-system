#!/bin/sh
# Copy renewed Let's Encrypt certs to the SSL dirs used by Docker Nginx.
# Dipakai manual ATAU sebagai certbot deploy-hook (renungan otomatis).
# Hanya copy domain yang ada di /etc/letsencrypt/live/ — yang tidak ada di-skip.
set -e

copy_cert() {
  DOMAIN="$1"
  SSL_DIR="$2"
  if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
    cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${SSL_DIR}/privkey.pem"
    chown ubuntu:ubuntu "${SSL_DIR}"/*.pem
    chmod 644 "${SSL_DIR}/fullchain.pem"
    chmod 600 "${SSL_DIR}/privkey.pem"
    echo "SSL certs updated for ${DOMAIN}"
  else
    echo "skip ${DOMAIN}: /etc/letsencrypt/live/${DOMAIN} tidak ada"
  fi
}

copy_cert "wedi-animal-care.ahlabs.my.id" "/home/ubuntu/vet-management-system/ssl"
copy_cert "dev-animal-care.ahlabs.my.id" "/home/ubuntu/vet-management-system/ssl-dev"

# Reload nginx to pick up new certs
docker exec vet-nginx nginx -s reload 2>/dev/null || true

echo "Done — nginx reloaded."
