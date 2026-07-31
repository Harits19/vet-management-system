#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  Vet Management System — Deploy"
echo "  Domain: http://wedi-animal-care.ahlabs.my.id"
echo "========================================"

# 1. Copy .env
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "⚠️  Copy .env.production.example → .env"
  echo "   EDIT .env DULU sebelum lanjut!"
  exit 1
fi

# 2. Load env
set -a; source .env; set +a

# 3. Pull & build
echo "📦 Building images..."
docker compose -f docker-compose.prod.yml build

# 4. Start
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Deploy selesai!"
echo "   Frontend: http://wedi-animal-care.ahlabs.my.id"
echo "   API:      http://wedi-animal-care.ahlabs.my.id/api"
echo ""
echo "📋 Logs: docker compose -f docker-compose.prod.yml logs -f"
