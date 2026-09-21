#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ENV_FILE=".env"

# 1. Cek dan muat variabel dari file .env
if [ -f "$ENV_FILE" ]; then
    echo "✔ Membaca file $ENV_FILE..."
    # Export variabel dari .env (mengabaikan baris kosong & komentar)
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "❌ Error: File '$ENV_FILE' tidak ditemukan di root project!"
    exit 1
fi


DOMAIN=""
EMAIL="${CERTBOT_EMAIL:-}"
STAGING=0

while [ $# -gt 0 ]; do
  case "$1" in
    -d|--domain) DOMAIN="${2:-}"; shift 2 ;;
    -e|--email)  EMAIL="${2:-}";  shift 2 ;;
    -s|--staging) STAGING=1; shift ;;
    *) echo "argumen tidak dikenal: $1 (pakai -d domain -e email)" >&2; exit 2 ;;
  esac
done

die() { echo "❌ $*" >&2; exit 1; }

[ "$(uname -s)" = "Linux" ] || die "Script ini untuk VPS Linux/Ubuntu."
command -v docker >/dev/null 2>&1 || die "Docker belum terpasang: bash install-docker.sh"
[ -f .env ] || die ".env belum ada: cp .env.example .env"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

if [ -z "$DOMAIN" ]; then
  DOMAIN="$(sed -nE 's/^FRONTEND_ORIGINS="?([^",]+).*/\1/p' .env | head -1 \
    | sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##')"
fi
[ -n "$DOMAIN" ] || die "Domain tidak diketahui. Set FRONTEND_ORIGINS di .env, atau pakai -d domain.tld"
[ -n "$EMAIL" ] || die "Email Let's Encrypt tidak diketahui. Set CERTBOT_EMAIL di .env, atau pakai -e kamu@mail.com"

echo "== domain: $DOMAIN | email: $EMAIL"

if ! command -v certbot >/dev/null 2>&1; then
  $SUDO apt-get update -y
  $SUDO apt-get install -y certbot
fi

# nginx menolak start kalau file cert yang direferensikan nginx.conf belum ada
# (fatal: cannot load certificate) -> isi self-signed dulu, ditimpa cert asli di bawah.
mkdir -p ssl certbot-webroot
if [ ! -s ssl/fullchain.pem ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ssl/privkey.pem -out ssl/fullchain.pem -subj "/CN=${DOMAIN}" >/dev/null 2>&1
  chmod 600 ssl/privkey.pem
  chmod 644 ssl/fullchain.pem
fi

docker compose up -d nginx

TOKEN="vet-acme-probe-$$"
echo ok > "certbot-webroot/$TOKEN"
REACHABLE=0
for _ in $(seq 1 20); do
  if curl -fsS --max-time 5 "http://${DOMAIN}/.well-known/acme-challenge/${TOKEN}" >/dev/null 2>&1; then
    REACHABLE=1
    break
  fi
  sleep 2
done
rm -f "certbot-webroot/$TOKEN"
[ "$REACHABLE" -eq 1 ] || die "Challenge HTTP-01 belum bisa diakses dari luar. Cek DNS A record '${DOMAIN}' -> IP VPS, port 80 terbuka, dan log: docker compose logs nginx"

ARGS=(
  certonly --webroot -w "$PWD/certbot-webroot" -d "$DOMAIN"
  --email "$EMAIL" --agree-tos --no-eff-email
  --non-interactive --keep-until-expiring
)
[ "$STAGING" -eq 1 ] && ARGS+=(--staging)
$SUDO "${ARGS[@]}"

$SUDO sh ./renew-ssl.sh

HOOK=/etc/letsencrypt/renewal-hooks/deploy/vet-renew-ssl.sh
$SUDO mkdir -p "$(dirname "$HOOK")"
printf '#!/bin/sh\nexec sh "%s/renew-ssl.sh"\n' "$PWD" | $SUDO tee "$HOOK" >/dev/null
$SUDO chmod 755 "$HOOK"
$SUDO systemctl enable --now certbot.timer 2>/dev/null || true

docker exec vet-nginx nginx -s reload 2>/dev/null || docker compose up -d --force-recreate nginx

echo "✅ https://${DOMAIN} siap (renewal otomatis lewat certbot.timer)"
