#!/bin/sh
# Copy renewed Let's Encrypt certs to the SSL directory used by Docker Nginx
set -e

DOMAIN="wedi-animal-care.ahlabs.my.id"
SSL_DIR="/home/ubuntu/vet-management-system/ssl"

cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${SSL_DIR}/fullchain.pem
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${SSL_DIR}/privkey.pem
chown ubuntu:ubuntu ${SSL_DIR}/*.pem
chmod 644 ${SSL_DIR}/fullchain.pem
chmod 600 ${SSL_DIR}/privkey.pem

# Reload nginx to pick up new certs
docker exec vet-nginx nginx -s reload 2>/dev/null || true

echo "SSL certs updated for ${DOMAIN} and nginx reloaded."
