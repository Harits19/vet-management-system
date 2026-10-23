#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "== .env dibuat dari .env.example"
fi
set -a; source .env; set +a

command -v docker >/dev/null 2>&1 || {
  echo "Docker belum terpasang: bash install-docker.sh, lalu logout/login."
  exit 1
}

if [ ! -s ssl/fullchain.pem ]; then
  if [ "${SELF_SIGNED:-0}" = "1" ]; then
    echo "== terbitkan sertifikat self-signed (on-prem tanpa internet)"
    bash scripts/vet-deploy.sh cert self-signed
  elif [ "${SKIP_HTTPS:-0}" = "1" ]; then
    echo "⚠️  SKIP_HTTPS=1 — sertifikat dilewati. nginx butuh ssl/fullchain.pem sebelum start."
  elif [ "$(uname -s)" = "Linux" ]; then
    echo "== terbitkan sertifikat HTTPS"
    sudo bash setup-https.sh
  else
    echo "⚠️  ssl/fullchain.pem belum ada — terbitkan di VPS: sudo bash setup-https.sh"
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
