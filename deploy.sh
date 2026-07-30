#!/usr/bin/env bash
set -euo pipefail

echo "================================"
echo "  Vet Management System — Deploy"
echo "================================"

# 1. Copy .env
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "⚠️  Copy .env.production.example → .env"
  echo "   EDIT .env DULU sebelum lanjut!"
  exit 1
fi

# 2. Load env
set -a; source .env; set +a

# 3. Buat folder SSL (letak manual)
mkdir -p ssl
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
  echo "⚠️  SSL cert/key tidak ditemukan di ./ssl/"
  echo "   Letakkan cert.pem & key.pem di ./ssl/ atau:"
  echo "     docker compose -f docker-compose.prod.yml run --rm certbot ..."
fi

# 4. Pull & build
echo "📦 Building images..."
docker compose -f docker-compose.prod.yml build

# 5. Start
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Deploy selesai!"
echo "   Backend: http://localhost:3001"
echo "   Frontend: http://localhost:3002"
echo "   Nginx: http://<vps-ip>"
echo ""
echo "📋 Logs: docker compose -f docker-compose.prod.yml logs -f"
