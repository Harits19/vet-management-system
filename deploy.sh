#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  Vet Management System — Deploy"
echo "  Domain: $FRONTEND_URL (atur di .env)"
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

echo ""
echo "✅ Deploy selesai!"
echo "   Frontend: ${NEXT_PUBLIC_API_URL:-http://localhost}"
echo "   API:      ${NEXT_PUBLIC_API_URL:-http://localhost}/api"
echo ""
echo "📋 Logs: docker compose logs -f"
