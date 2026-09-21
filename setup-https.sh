#!/usr/bin/env bash
# setup-https.sh — aktifkan HTTPS (Let's Encrypt) untuk stack Docker
# vet-management-system di VPS Ubuntu, dalam SATU kali jalan.
#
# Urutan kerja:
#   1. cek prasyarat (Linux + docker + docker compose + .env)
#   2. install certbot (apt) kalau belum ada
#   3. bootstrap self-signed cert kalau ssl/ masih kosong → nginx bisa start
#   4. pastikan nginx hidup + HTTP-01 challenge benar-benar bisa diakses dari luar
#   5. terbitkan cert (webroot) untuk domain
#   6. copy cert ke ssl/ (dan ssl-dev/) lewat renew-ssl.sh
#   7. pasang deploy-hook renewal otomatis (certbot.timer + renew-ssl.sh)
#   8. reload nginx + verifikasi HTTPS
#   9. opsional (--update-env): ubah .env ke https + rebuild frontend
#
# Pakai:
#   sudo bash setup-https.sh -d wedi-animal-care.ahlabs.my.id -e admin@ahlabs.my.id
#   sudo bash setup-https.sh -d dev.example.com -e me@mail.com --update-env
#   sudo bash setup-https.sh -d example.com -e me@mail.com --staging   # tes, hindari rate limit
#
# Idempotent: aman diulang. Cert yang masih valid tidak diterbitkan ulang
# (--keep-until-expiring), jadi tidak kena rate limit Let's Encrypt.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Argumen ────────────────────────────────────────────────────────────
DOMAIN=""
EMAIL="${CERTBOT_EMAIL:-}"
STAGING=0
UPDATE_ENV=0
SKIP_DNS_CHECK=0

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    -d|--domain) DOMAIN="${2:-}"; shift 2 ;;
    -e|--email)  EMAIL="${2:-}";  shift 2 ;;
    -s|--staging) STAGING=1; shift ;;
    --update-env) UPDATE_ENV=1; shift ;;
    --skip-dns-check) SKIP_DNS_CHECK=1; shift ;;
    -h|--help) usage ;;
    *) echo "Argumen tidak dikenal: $1 (pakai -h untuk bantuan)" >&2; exit 2 ;;
  esac
done

die() { echo "❌ $*" >&2; exit 1; }
step() { echo ""; echo "=== $* ==="; }

# ── 1. Prasyarat ───────────────────────────────────────────────────────
step "1. Cek prasyarat"

[ "$(uname -s)" = "Linux" ] || die "Script ini untuk VPS Linux/Ubuntu."
command -v docker >/dev/null 2>&1 || die "Docker belum terpasang. Jalankan dulu: bash install-docker.sh"
docker compose version >/dev/null 2>&1 || die "Plugin 'docker compose' tidak ada. Install docker-compose-plugin."
[ -f "$SCRIPT_DIR/.env" ] || die ".env tidak ada. Jalankan: cp .env.example .env lalu isi nilainya."

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

# Domain default: dari .env (NEXT_PUBLIC_API_URL / FRONTEND_ORIGINS).
if [ -z "$DOMAIN" ]; then
  for key in NEXT_PUBLIC_API_URL FRONTEND_ORIGINS; do
    raw="$(grep -E "^${key}=" .env | tail -1 | cut -d= -f2- | tr -d '"' || true)"
    raw="${raw%%,*}"
    if [ -n "$raw" ]; then
      DOMAIN="$(printf '%s' "$raw" | sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##')"
      break
    fi
  done
fi
[ -n "$DOMAIN" ] || die "Domain tidak diketahui. Pakai: -d domain.tld"
[ -n "$EMAIL" ] || die "Email untuk Let's Encrypt wajib. Pakai: -e kamu@mail.com (atau export CERTBOT_EMAIL)"

echo "Domain : $DOMAIN"
echo "Email  : $EMAIL"
[ "$STAGING" -eq 1 ] && echo "Mode   : STAGING (cert tidak dipercaya browser — untuk tes)"
echo "Docker : $(docker --version)"

# Domain harus punya blok HTTPS di nginx.conf, kalau tidak HTTPS tidak akan dilayani.
if ! grep -q "server_name .*${DOMAIN}" "$SCRIPT_DIR/nginx.conf"; then
  echo "⚠️  '$DOMAIN' tidak ditemukan di nginx.conf (server_name)."
  echo "    Tambahkan blok server 80 (acme-challenge) + 443 dulu, kalau tidak HTTPS tidak jalan."
fi

# ── 2. certbot ─────────────────────────────────────────────────────────
step "2. Pastikan certbot terpasang"
if command -v certbot >/dev/null 2>&1; then
  echo "certbot sudah ada: $(certbot --version 2>&1)"
else
  $SUDO apt-get update -y
  $SUDO apt-get install -y certbot
fi

# ── 3. Bootstrap ssl/ ──────────────────────────────────────────────────
step "3. Siapkan direktori cert (bootstrap kalau masih kosong)"
mkdir -p "$SCRIPT_DIR/certbot-webroot"

# nginx TIDAK mau start kalau ADA SATU SAJA file cert yang direferensikan nginx.conf hilang
# (fatal: cannot load certificate ... No such file or directory) → container restart-loop,
# port 80/443 tak pernah terbuka, dan acme-challenge mustahil dilayani. Jadi semua direktori
# cert yang dipakai nginx.conf diisi self-signed 1 hari dulu, ditimpa cert asli di langkah 6.
bootstrap_dir() {
  local host_dir="$1"
  if [ -s "$host_dir/fullchain.pem" ] && [ -s "$host_dir/privkey.pem" ]; then
    echo "  ok     : ${host_dir#"$SCRIPT_DIR"/} sudah ada"
    return 0
  fi
  mkdir -p "$host_dir"
  echo "  bootstrap: ${host_dir#"$SCRIPT_DIR"/} (self-signed 1 hari, sementara)"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$host_dir/privkey.pem" \
    -out "$host_dir/fullchain.pem" \
    -subj "/CN=${DOMAIN}" >/dev/null 2>&1
  chmod 600 "$host_dir/privkey.pem"
  chmod 644 "$host_dir/fullchain.pem"
}

# Ambil semua direktori cert dari nginx.conf: /etc/nginx/ssl-dev → <repo>/ssl-dev
# Baris komentar dibuang dulu — kalau tidak, blok server yang dimatikan (di-comment)
# tetap ikut ke-bootstrap, padahal nginx tidak lagi mereferensikannya.
CERT_DIRS="$(sed -E '/^[[:space:]]*#/d' "$SCRIPT_DIR/nginx.conf" \
  | grep -oE 'ssl_certificate(_key)?[[:space:]]+/etc/nginx/[^;]+;' \
  | sed -E 's#.*[[:space:]](/etc/nginx/[^/]+)/.*#\1#' | sort -u || true)"

if [ -z "$CERT_DIRS" ]; then
  echo "⚠️  tidak ada directive ssl_certificate di nginx.conf — hanya ssl/ yang disiapkan"
  bootstrap_dir "$SCRIPT_DIR/ssl"
else
  for d in $CERT_DIRS; do
    bootstrap_dir "$SCRIPT_DIR/${d#/etc/nginx/}"
  done
fi

# ── 4. nginx hidup + challenge reachable ───────────────────────────────
step "4. Nyalakan nginx & tes jalur challenge"
docker compose up -d nginx

PROBE_TOKEN="vet-acme-probe-$$"
echo "ok" > "$SCRIPT_DIR/certbot-webroot/$PROBE_TOKEN"
trap 'rm -f "$SCRIPT_DIR/certbot-webroot/$PROBE_TOKEN"' EXIT

reachable=0
for i in $(seq 1 20); do
  if curl -fsS --max-time 5 "http://${DOMAIN}/.well-known/acme-challenge/${PROBE_TOKEN}" >/dev/null 2>&1; then
    reachable=1; break
  fi
  sleep 2
done

if [ "$reachable" -eq 1 ]; then
  echo "✅ http://${DOMAIN}/.well-known/acme-challenge/ bisa diakses dari luar"
else
  echo "⚠️  Challenge BELUM bisa diakses lewat domain. Kemungkinan:"
  echo "    - DNS A record ${DOMAIN} belum mengarah ke IP VPS ini"
  echo "    - port 80 diblokir (ufw/firewall provider)"
  echo "    - nginx container tidak jalan (cek: docker compose logs nginx)"
  echo "    Lanjut? certbot akan gagal. Tekan Ctrl+C untuk batal, Enter untuk tetap lanjut."
  read -r _
fi

rm -f "$SCRIPT_DIR/certbot-webroot/$PROBE_TOKEN"
trap - EXIT

# ── 5. Terbitkan cert ──────────────────────────────────────────────────
step "5. Terbitkan cert Let's Encrypt (webroot)"
CERTBOT_ARGS=(
  certonly --webroot
  -w "$SCRIPT_DIR/certbot-webroot"
  -d "$DOMAIN"
  --email "$EMAIL" --agree-tos --no-eff-email
  --non-interactive --keep-until-expiring
)
[ "$STAGING" -eq 1 ] && CERTBOT_ARGS+=(--staging)
$SUDO "${CERTBOT_ARGS[@]}"

# ── 6. Copy cert ke ssl/ ───────────────────────────────────────────────
step "6. Copy cert ke ssl/ (renew-ssl.sh)"
$SUDO sh "$SCRIPT_DIR/renew-ssl.sh"

# ── 7. Renewal otomatis ────────────────────────────────────────────────
step "7. Pasang deploy-hook renewal otomatis"
HOOK_DIR=/etc/letsencrypt/renewal-hooks/deploy
HOOK_FILE="$HOOK_DIR/vet-management-renew-ssl.sh"
$SUDO mkdir -p "$HOOK_DIR"
printf '#!/bin/sh\n# Dipasang otomatis oleh setup-https.sh — copy cert hasil renewal ke ssl/ lalu reload nginx.\nexec sh "%s/renew-ssl.sh"\n' "$SCRIPT_DIR" | $SUDO tee "$HOOK_FILE" >/dev/null
$SUDO chmod 755 "$HOOK_FILE"
echo "Hook: $HOOK_FILE"

if systemctl list-timers --all 2>/dev/null | grep -q certbot; then
  echo "certbot.timer aktif → renewal jalan otomatis (hook di atas dipanggil tiap renewal)"
else
  echo "ℹ️  certbot.timer tidak terdeteksi. Aktifkan: $SUDO systemctl enable --now certbot.timer"
fi

# ── 8. Reload + verifikasi ─────────────────────────────────────────────
step "8. Reload nginx & verifikasi HTTPS"
docker exec vet-nginx nginx -t >/dev/null 2>&1 && echo "nginx -t: OK" || echo "⚠️  nginx -t gagal, cek: docker compose logs nginx"
docker exec vet-nginx nginx -s reload 2>/dev/null || docker compose restart nginx

$SUDO certbot renew --dry-run --cert-name "$DOMAIN" >/dev/null 2>&1 && echo "renew --dry-run: OK" || echo "⚠️  renew --dry-run gagal (cek: certbot renew --dry-run -v)"

echo ""
curl -sSI --max-time 10 "https://${DOMAIN}" | head -1 || echo "⚠️  HTTPS belum menjawab — cek DNS/port 443/cert"

# ── 9. Opsional: rapikan .env ──────────────────────────────────────────
step "9. Nilai .env yang harus https"
if [ "$UPDATE_ENV" -eq 1 ]; then
  cp .env ".env.bak.$(date +%Y%m%d_%H%M%S)"
  set_kv() {
    local key="$1" val="$2"
    if grep -qE "^${key}=" .env; then
      sed -i.tmp -E "s#^${key}=.*#${key}=${val}#" .env && rm -f .env.tmp
    else
      # .env bisa berakhir tanpa newline → tambahkan dulu, kalau tidak key baru nempel di baris terakhir.
      if [ -n "$(tail -c 1 .env 2>/dev/null)" ]; then printf '\n' >> .env; fi
      printf '%s=%s\n' "$key" "$val" >> .env
    fi
  }
  set_kv NEXT_PUBLIC_API_URL "https://${DOMAIN}"
  set_kv FRONTEND_ORIGINS "https://${DOMAIN}"
  set_kv COOKIE_SECURE "true"
  echo ".env diupdate (backup: .env.bak.*)"
  echo "Rebuild frontend (NEXT_PUBLIC_API_URL di-bake saat build) + restart backend..."
  docker compose up -d --build frontend backend
else
  echo "Set manual di .env, lalu WAJIB rebuild frontend (nilai ini di-bake saat build):"
  echo "  NEXT_PUBLIC_API_URL=https://${DOMAIN}"
  echo "  FRONTEND_ORIGINS=https://${DOMAIN}"
  echo "  COOKIE_SECURE=true"
  echo ""
  echo "  docker compose up -d --build frontend backend"
fi

echo ""
echo "=========================================================="
echo "✅ HTTPS selesai untuk https://${DOMAIN}"
echo "   Cert   : /etc/letsencrypt/live/${DOMAIN}/"
echo "   SSL dir: ${SCRIPT_DIR}/ssl/fullchain.pem + privkey.pem"
echo "   Renew  : otomatis via certbot.timer → hook ${HOOK_FILE}"
echo "   Cek    : curl -I https://${DOMAIN}"
echo "=========================================================="
