#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  Vet Management System — Deploy"
echo "  Domain: http://wedi-animal-care.ahlabs.my.id"
echo "========================================"

# 1. Copy .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Copy .env.example → .env"
  echo "   EDIT .env DULU sebelum lanjut!"
  exit 1
fi

# 2. Load env
set -a; source .env; set +a

# 3. Pull & build
echo "📦 Building images..."
docker compose build

# 4. Start
echo "🚀 Starting services..."
docker compose up -d

# 5. Restart nginx — resolve ulang IP container backend/frontend.
# Saat container di-recreate, IP docker-nya bisa berubah; tanpa restart,
# nginx masih cache IP lama → 502 Bad Gateway untuk /api/*.
echo "🔄 Restart nginx (refresh upstream IP)..."
docker compose restart nginx

echo ""
echo "✅ Deploy selesai!"
echo "   Frontend: http://wedi-animal-care.ahlabs.my.id"
echo "   API:      http://wedi-animal-care.ahlabs.my.id/api"
echo ""
echo "📋 Logs: docker compose logs -f"
