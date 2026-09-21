#!/bin/sh
set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

DOMAIN="$(sed -nE 's/^FRONTEND_ORIGINS="?([^",]+).*/\1/p' "$BASE_DIR/.env" 2>/dev/null | head -1 \
  | sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##')"

if [ -z "$DOMAIN" ] || [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "skip: cert tidak ditemukan untuk domain '${DOMAIN}'"
  exit 0
fi

mkdir -p "$BASE_DIR/ssl"
cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$BASE_DIR/ssl/fullchain.pem"
cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "$BASE_DIR/ssl/privkey.pem"
chmod 644 "$BASE_DIR/ssl/fullchain.pem"
chmod 600 "$BASE_DIR/ssl/privkey.pem"
chown ubuntu:ubuntu "$BASE_DIR/ssl"/*.pem 2>/dev/null || true

docker exec vet-nginx nginx -s reload 2>/dev/null || true

echo "SSL certs updated for ${DOMAIN}"
