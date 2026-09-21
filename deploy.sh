#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

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


if [ ! -f .env ]; then
  cp .env.example .env
  echo "== .env dibuat dari .env.example"
fi
set -a; source .env; set +a

command -v docker >/dev/null 2>&1 || {
  echo "Docker belum terpasang. Jalankan: bash install-docker.sh"
  echo "Lalu logout/login (atau newgrp docker) dan ulangi: bash deploy.sh"
  exit 1
}

if [ ! -s ssl/fullchain.pem ]; then
  if [ "$(uname -s)" = "Linux" ]; then
    echo "== terbitkan sertifikat HTTPS"
    sudo bash setup-https.sh
  else
    echo "⚠️  ssl/fullchain.pem belum ada — terbitkan sertifikat di VPS: sudo bash setup-https.sh"
  fi
fi

echo "== build & start"
docker compose build
docker compose up -d
docker compose up -d --force-recreate nginx

DOMAIN="$(printf '%s' "${FRONTEND_ORIGINS:-}" | cut -d, -f1 | sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##')"
echo ""
echo "✅ Selesai"
echo "   Buka   : https://${DOMAIN}"
echo "   Login  : superadmin / ${DEFAULT_USER_PASSWORD:-password123}"
echo "   Logs   : docker compose logs -f"
