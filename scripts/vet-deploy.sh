#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Vet Management System — helper deployment on-premise (Docker).
# Satu pintu untuk: preflight check, init .env, sertifikat,
# build/up/update, backup/restore, dan operasi harian.
#
# Pemakaian: bash scripts/vet-deploy.sh <perintah> [arg]
#            bash scripts/vet-deploy.sh help
# Dokumen lengkap: docs/on-premise-deployment.md
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
MONGO_CONTAINER="${MONGO_CONTAINER:-vet-mongodb}"
NGINX_CONTAINER="${NGINX_CONTAINER:-vet-nginx}"
BACKUP_DIR="${BACKUP_DIR:-backup}"
BACKUP_KEEP="${BACKUP_KEEP:-7}"
SELF_SIGNED_DAYS="${SELF_SIGNED_DAYS:-3650}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"

DOCKER=(docker)
DC=(docker compose -f "$COMPOSE_FILE")

# ── output helpers ───────────────────────────────────────────
info() { printf '== %s\n' "$*"; }
ok() { printf '✅ %s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
bad() { printf '❌ %s\n' "$*" >&2; }
die() {
  bad "$*"
  exit 1
}

# ── docker detection ─────────────────────────────────────────
detect_docker() {
  command -v docker >/dev/null 2>&1 ||
    die "Docker belum terpasang. Jalankan: bash install-docker.sh, lalu logout/login."
  if docker info >/dev/null 2>&1; then
    DOCKER=(docker)
  elif command -v sudo >/dev/null 2>&1 && sudo -n docker info >/dev/null 2>&1; then
    DOCKER=(sudo docker)
  else
    die "Tidak bisa akses Docker daemon. Tambahkan user ke grup docker (sudo usermod -aG docker \"\$USER\") lalu login ulang."
  fi
  DC=("${DOCKER[@]}" compose -f "$COMPOSE_FILE")
}

# ── .env helpers ─────────────────────────────────────────────
load_env() {
  [ -f .env ] || die ".env belum ada. Buat dulu: bash scripts/vet-deploy.sh init <domain> [email]"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
  MONGO_APP_DATABASE="${MONGO_APP_DATABASE:-vet-management}"
  MONGO_INITDB_ROOT_USERNAME="${MONGO_INITDB_ROOT_USERNAME:-root}"
  MONGO_APP_USERNAME="${MONGO_APP_USERNAME:-vetapp}"
}

env_get() {
  sed -nE "s/^$1=\"?([^\"]*)\"?[[:space:]]*\$/\1/p" .env | tr -d '\r' | head -1
}

set_env() {
  local key="$1" val="$2" tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" .env; then
    awk -v k="$key" -v v="$val" '
      $0 ~ "^" k "=" { print k "=\"" v "\""; next }
      { print }
    ' .env >"$tmp"
  else
    cat .env >"$tmp"
    printf '%s="%s"\n' "$key" "$val" >>"$tmp"
  fi
  mv "$tmp" .env
}

domain_of() {
  printf '%s' "${FRONTEND_ORIGINS:-}" | cut -d, -f1 |
    sed -E 's#^https?://##; s#/.*$##; s#:[0-9]+$##'
}

gen_secret() { openssl rand -hex 24; }
gen_password() { openssl rand -hex 8; }

is_placeholder() {
  case "$1:$2" in
  JWT_SECRET:dev-secret-change-me) return 0 ;;
  MONGO_INITDB_ROOT_PASSWORD:dev-root-password) return 0 ;;
  MONGO_APP_PASSWORD:dev-app-password) return 0 ;;
  DEFAULT_USER_PASSWORD:password123) return 0 ;;
  *) return 1 ;;
  esac
}

# ── command: help ────────────────────────────────────────────
cmd_help() {
  cat <<'EOF'
Vet Management System — deployment on-premise (Docker)

Pemakaian: bash scripts/vet-deploy.sh <perintah> [arg]

Instalasi & sertifikat
  init <domain> [email]      buat .env dari template + generate secret acak
  cert self-signed [domain]  sertifikat self-signed (LAN / tanpa internet)
  cert lets-encrypt          sertifikat Let's Encrypt (butuh domain publik)
  cert status                masa berlaku sertifikat yang terpasang

Build & jalankan
  up                         build image + start semua service + tunggu sehat
  update                     git pull --ff-only lalu `up`
  restart [service]          restart service (tanpa arg = semua)
  down                       stop & hapus container (volume/data tetap)

Operasi harian
  doctor                     cek prasyarat & status (read-only)
  status                     daftar container + cek /api/health
  logs [service]             ikuti log (Ctrl+C untuk keluar)
  shell <service>            sh masuk ke container (mongodb|backend|frontend|nginx)
  mongo                      mongosh interaktif ke database aplikasi

Data
  backup [label]             dump MongoDB ke backup/vet-<tanggal>.archive.gz
  restore <file>             restore archive (non-destruktif)
                             RESTORE_DROP=1 = hapus koleksi lama dulu (DESTRUKTIF)
  reset                      ⚠️  hapus container + volume MongoDB (DATA HILANG)

Env opsional: BACKUP_KEEP (default 7), HEALTH_TIMEOUT (90), SELF_SIGNED_DAYS (3650).
EOF
}

# ── command: init ────────────────────────────────────────────
cmd_init() {
  local domain="${1:-}" email="${2:-}" fresh=0 forced="${FORCE:-0}"
  [ "${3:-}" = "--force" ] && forced=1

  if [ ! -f .env ]; then
    [ -f .env.example ] || die ".env.example tidak ada — repo tidak lengkap."
    cp .env.example .env
    fresh=1
    info ".env dibuat dari .env.example"
  else
    info ".env sudah ada — hanya nilai yang belum diubah yang akan di-isi ulang"
  fi

  if [ -n "$domain" ]; then
    domain="$(printf '%s' "$domain" | sed -E 's#^https?://##; s#/.*$##')"
    set_env FRONTEND_ORIGINS "https://${domain},http://localhost:3002"
    info "FRONTEND_ORIGINS = https://${domain},http://localhost:3002"
  fi
  [ -n "$email" ] && set_env CERTBOT_EMAIL "$email" && info "CERTBOT_EMAIL = ${email}"

  local key cur
  for key in JWT_SECRET MONGO_INITDB_ROOT_PASSWORD MONGO_APP_PASSWORD; do
    cur="$(env_get "$key")"
    if [ "$fresh" = 1 ] || [ "$forced" = 1 ] || is_placeholder "$key" "$cur" || [ -z "$cur" ]; then
      set_env "$key" "$(gen_secret)"
      info "$key digenerate ulang"
    fi
  done
  cur="$(env_get DEFAULT_USER_PASSWORD)"
  if [ "$fresh" = 1 ] || [ "$forced" = 1 ] || is_placeholder DEFAULT_USER_PASSWORD "$cur"; then
    set_env DEFAULT_USER_PASSWORD "$(gen_password)"
  fi

  chmod 600 .env
  echo ""
  ok ".env siap (permission 600)"
  info "Login awal: superadmin / $(env_get DEFAULT_USER_PASSWORD)"
  warn "Simpan password di atas — tidak ditampilkan lagi dan tidak di-commit (.env di-gitignore)."
  echo ""
  echo "Lanjut: bash scripts/vet-deploy.sh cert self-signed   # LAN / tanpa internet"
  echo "    atau bash scripts/vet-deploy.sh cert lets-encrypt # domain publik"
  echo "         lalu bash scripts/vet-deploy.sh up"
}

# ── command: cert ────────────────────────────────────────────
cmd_cert() {
  local sub="${1:-}"
  shift || true

  case "$sub" in
  self-signed)
    load_env
    local domain="${1:-$(domain_of)}" force=0
    [ "${2:-}" = "--force" ] && force=1
    [ -n "$domain" ] || die "Domain kosong. Pakai: cert self-signed <domain/IP> atau set FRONTEND_ORIGINS di .env"
    if [ -s ssl/fullchain.pem ] && [ "$force" = 0 ]; then
      die "ssl/fullchain.pem sudah ada. Timpa dengan: bash scripts/vet-deploy.sh cert self-signed ${domain} --force"
    fi
    local ip
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    local san="DNS:${domain},DNS:localhost,IP:127.0.0.1"
    [ -n "$ip" ] && san="${san},IP:${ip}"
    mkdir -p ssl
    openssl req -x509 -nodes -newkey rsa:2048 -days "$SELF_SIGNED_DAYS" \
      -keyout ssl/privkey.pem -out ssl/fullchain.pem \
      -subj "/CN=${domain}" -addext "subjectAltName=${san}" >/dev/null 2>&1
    chmod 600 ssl/privkey.pem
    chmod 644 ssl/fullchain.pem
    ok "Sertifikat self-signed untuk ${domain} (${SELF_SIGNED_DAYS} hari, SAN: ${san})"
    warn "Browser akan menampilkan peringatan 'tidak tepercaya' kecuali sertifikat CA dipasang di klien."
    if command -v docker >/dev/null 2>&1 &&
      docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$NGINX_CONTAINER"; then
      docker exec "$NGINX_CONTAINER" nginx -s reload && ok "nginx reload"
    else
      info "nginx belum jalan — sertifikat dipakai saat 'up'"
    fi
    ;;
  lets-encrypt)
    load_env
    [ "$(uname -s)" = "Linux" ] || die "Let's Encrypt webroot hanya untuk host Linux."
    info "menjalankan setup-https.sh (sudo)"
    sudo bash setup-https.sh
    ok "Sertifikat Let's Encrypt terpasang + renewal otomatis (certbot.timer)"
    ;;
  status)
    [ -s ssl/fullchain.pem ] || die "ssl/fullchain.pem belum ada. Terbitkan dulu: cert self-signed | lets-encrypt"
    openssl x509 -in ssl/fullchain.pem -noout -subject -issuer -dates
    local end days
    end="$(openssl x509 -in ssl/fullchain.pem -noout -enddate | cut -d= -f2)"
    days="$((($(date -d "$end" +%s) - $(date +%s)) / 86400))"
    if [ "$days" -lt 14 ]; then
      warn "Sertifikat kedaluwarsa dalam ${days} hari"
    else
      ok "Berlaku ${days} hari lagi"
    fi
    ;;
  *)
    die "Pakai: cert self-signed [domain] [--force] | cert lets-encrypt | cert status"
    ;;
  esac
}

# ── command: up / update / restart / down / reset ─────────────
wait_healthy() {
  local waited=0 code
  info "tunggu /api/health (maks ${HEALTH_TIMEOUT}s)"
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    code="$(curl -k -s -o /dev/null -w '%{http_code}' --max-time 5 https://127.0.0.1/api/health 2>/dev/null || true)"
    if [ "$code" = "200" ]; then
      ok "backend sehat (https://127.0.0.1/api/health → 200)"
      return 0
    fi
    sleep 3
    waited=$((waited + 3))
  done
  warn "health check belum 200 setelah ${HEALTH_TIMEOUT}s — cek: bash scripts/vet-deploy.sh logs backend"
  return 1
}

cmd_up() {
  detect_docker
  load_env
  if [ ! -s ssl/fullchain.pem ]; then
    warn "ssl/fullchain.pem belum ada — nginx akan gagal start dengan pesan TLS."
    echo "   Buat sertifikat dulu: bash scripts/vet-deploy.sh cert self-signed|lets-encrypt"
  fi
  info "build image"
  "${DC[@]}" build
  info "start container"
  "${DC[@]}" up -d
  "${DC[@]}" up -d --force-recreate nginx
  "${DC[@]}" ps
  wait_healthy || true
  local domain
  domain="$(domain_of)"
  echo ""
  ok "Selesai — https://${domain:-127.0.0.1} (self-signed: tambahkan -k / terima peringatan browser)"
  info "Login: superadmin / $(env_get DEFAULT_USER_PASSWORD)"
  info "Log  : bash scripts/vet-deploy.sh logs"
}

cmd_update() {
  detect_docker
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Bukan git repository — update manual lalu jalankan 'up'."
  if [ -n "$(git status --porcelain)" ] && [ "${FORCE:-0}" != "1" ]; then
    die "Ada perubahan lokal belum di-commit. Commit/stash dulu, atau paksa dengan FORCE=1."
  fi
  info "git fetch + pull --ff-only ($(git rev-parse --abbrev-ref HEAD))"
  git fetch --prune origin
  git pull --ff-only
  cmd_up
}

cmd_restart() {
  detect_docker
  "${DC[@]}" restart "$@"
  warn "restart TIDAK membaca ulang .env — kalau .env berubah pakai: docker compose up -d"
}

cmd_down() {
  detect_docker
  "${DC[@]}" down
  ok "container dihapus (data MongoDB tetap di volume mongodb_data)"
}

cmd_reset() {
  detect_docker
  load_env
  echo "⚠️  DESTRUKTIF: semua container dihapus dan volume mongodb_data (database '${MONGO_APP_DATABASE}') DIHAPUS."
  printf 'Ketik nama database untuk lanjut: '
  read -r answer
  [ "$answer" = "$MONGO_APP_DATABASE" ] || die "Dibatalkan."
  "${DC[@]}" down -v
  ok "container + volume dihapus"
}

# ── command: status / logs / shell / mongo ───────────────────
cmd_status() {
  detect_docker
  "${DC[@]}" ps
  local code
  code="$(curl -k -s -o /dev/null -w '%{http_code}' --max-time 5 https://127.0.0.1/api/health 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    ok "/api/health → 200"
  else
    warn "/api/health → ${code:-tidak ada respons}"
  fi
}

cmd_logs() {
  detect_docker
  "${DC[@]}" logs -f --tail=100 "$@"
}

container_of() {
  case "$1" in
  mongodb) printf '%s' "$MONGO_CONTAINER" ;;
  nginx) printf '%s' "$NGINX_CONTAINER" ;;
  backend) printf '%s' "vet-backend" ;;
  frontend) printf '%s' "vet-frontend" ;;
  *) printf '%s' "$1" ;;
  esac
}

cmd_shell() {
  detect_docker
  local svc="${1:-}"
  [ -n "$svc" ] || die "Pakai: shell <mongodb|backend|frontend|nginx>"
  "${DOCKER[@]}" exec -it "$(container_of "$svc")" sh
}

cmd_mongo() {
  detect_docker
  load_env
  "${DOCKER[@]}" exec -it "$MONGO_CONTAINER" mongosh \
    -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin "$MONGO_APP_DATABASE"
}

# ── command: backup / restore ────────────────────────────────
cmd_backup() {
  detect_docker
  load_env
  mkdir -p "$BACKUP_DIR"
  local label="${1:-}" stamp name out size
  stamp="$(date +%Y%m%d-%H%M%S)"
  name="vet-${stamp}${label:+-$label}.archive.gz"
  out="$BACKUP_DIR/$name"
  info "mongodump ${MONGO_APP_DATABASE} → $out"
  "${DOCKER[@]}" exec "$MONGO_CONTAINER" mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin --db "$MONGO_APP_DATABASE" \
    --archive --gzip >"$out"
  size="$(stat -c %s "$out" 2>/dev/null || echo 0)"
  [ "$size" -gt 0 ] || die "Backup kosong — cek: docker compose logs mongodb"
  gzip -t "$out" || die "Arsip korup (gzip -t gagal): $out"
  ok "Backup valid: $out ($(numfmt --to=iec "$size" 2>/dev/null || echo "$size B"))"

  local old
  old="$(ls -1t "$BACKUP_DIR"/vet-*.archive.gz 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" || true)"
  if [ -n "$old" ]; then
    printf '%s\n' "$old" | xargs -r rm -f
    info "prune: simpan ${BACKUP_KEEP} arsip terbaru"
  fi
}

cmd_restore() {
  local file="${1:-}"
  [ -n "$file" ] || die "Pakai: restore <file.archive.gz> (lihat isi: ls backup/)"
  [ -f "$file" ] || die "File tidak ditemukan: $file"
  detect_docker
  load_env

  local gz=()
  gzip -t "$file" 2>/dev/null && gz=(--gzip)

  local args=(
    --username "$MONGO_INITDB_ROOT_USERNAME"
    --password "$MONGO_INITDB_ROOT_PASSWORD"
    --authenticationDatabase admin
    --db "$MONGO_APP_DATABASE"
    --archive
  )

  if [ "${RESTORE_DROP:-0}" = "1" ]; then
    echo "⚠️  RESTORE_DROP=1 → koleksi di '${MONGO_APP_DATABASE}' dihapus dulu sebelum restore."
    printf 'Ketik nama database untuk lanjut: '
    read -r answer
    [ "$answer" = "$MONGO_APP_DATABASE" ] || die "Dibatalkan."
    args+=(--drop)
  else
    info "mode non-destruktif: data lama dipertahankan (_id duplikat dilewati)"
  fi

  info "mongorestore $file → ${MONGO_APP_DATABASE}"
  "${DOCKER[@]}" exec -i "$MONGO_CONTAINER" mongorestore "${args[@]}" ${gz[@]+"${gz[@]}"} <"$file"
  ok "Restore selesai. Verifikasi: bash scripts/vet-deploy.sh mongo"
}

# ── command: doctor ──────────────────────────────────────────
FAIL=0
check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    printf '✅ %s\n' "$label"
  else
    printf '❌ %s\n' "$label"
    FAIL=$((FAIL + 1))
  fi
}

port_listening() {
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1\$"
}

cmd_doctor() {
  echo "── Host ───────────────────────────────────────────"
  printf '   %s %s | %s core | RAM %s MB | disk / sisa %s\n' \
    "$(uname -s)" "$(uname -r)" "$(nproc)" \
    "$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)" \
    "$(df -hP / | awk 'NR==2{print $4}')"
  local ram disk_free
  ram="$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)"
  disk_free="$(df -Pk / | awk 'NR==2{print $4}')"
  [ "$ram" -ge 2000 ] || warn "RAM < 2 GB — 'next build' bisa OOM. Tambah swap sebelum build."
  [ "$disk_free" -ge 5242880 ] || warn "Sisa disk < 5 GB — build + backup butuh ruang."

  echo "── Docker ─────────────────────────────────────────"
  check "docker terpasang" command -v docker
  check "docker daemon dapat diakses" docker info
  printf '   compose: %s\n' "$(docker compose version --short 2>/dev/null || echo '-')"

  echo "── Konfigurasi ────────────────────────────────────"
  check ".env ada" test -f .env
  [ -f .env ] && load_env
  if [ -f .env ]; then
    local empties=""
    local k
    for k in JWT_SECRET MONGO_INITDB_ROOT_PASSWORD MONGO_APP_PASSWORD DEFAULT_USER_PASSWORD FRONTEND_ORIGINS; do
      [ -n "$(env_get "$k")" ] || empties="${empties} ${k}"
    done
    [ -z "$empties" ] || { bad "nilai .env kosong:${empties}"; FAIL=$((FAIL + 1)); }
    local placeholder=""
    for k in JWT_SECRET MONGO_INITDB_ROOT_PASSWORD MONGO_APP_PASSWORD DEFAULT_USER_PASSWORD; do
      is_placeholder "$k" "$(env_get "$k")" && placeholder="${placeholder} ${k}"
    done
    if [ -n "$placeholder" ]; then
      warn "masih memakai nilai default repo:${placeholder} — generate: FORCE=1 bash scripts/vet-deploy.sh init"
    fi
    printf '   domain : %s\n' "$(domain_of)"
  fi

  echo "── Port & sertifikat ──────────────────────────────"
  if port_listening 80 && port_listening 443; then
    printf '✅ port 80 & 443 terpakai (milik container nginx)\n'
  elif port_listening 80 || port_listening 443; then
    warn "sebagian port 80/443 terpakai proses lain — pastikan itu nginx kita (ss -ltnp)"
  else
    printf '✅ port 80 & 443 bebas\n'
  fi
  if [ -s ssl/fullchain.pem ]; then
    local end days
    end="$(openssl x509 -in ssl/fullchain.pem -noout -enddate | cut -d= -f2)"
    days="$((($(date -d "$end" +%s) - $(date +%s)) / 86400))"
    if [ "$days" -lt 14 ]; then
      warn "sertifikat kedaluwarsa dalam ${days} hari (bash scripts/vet-deploy.sh cert status)"
    else
      printf '✅ sertifikat berlaku %s hari lagi\n' "$days"
    fi
  else
    warn "ssl/fullchain.pem belum ada — nginx tidak bisa start TLS"
    FAIL=$((FAIL + 1))
  fi

  echo "── Layanan ────────────────────────────────────────"
  if [ ! -f "$COMPOSE_FILE" ]; then
    bad "compose file '${COMPOSE_FILE}' tidak ada di ${PWD}"
    FAIL=$((FAIL + 1))
  elif docker info >/dev/null 2>&1; then
    "${DC[@]}" ps
    if "${DOCKER[@]}" ps --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER" && [ -f .env ]; then
      if "${DOCKER[@]}" exec "$MONGO_CONTAINER" mongosh \
        -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase admin --quiet --eval 'db.adminCommand({ping:1}).ok' >/dev/null 2>&1; then
        printf '✅ mongosh login (root) ok\n'
      else
        bad "login root MongoDB gagal — cek MONGO_INITDB_ROOT_PASSWORD vs volume lama"
        FAIL=$((FAIL + 1))
      fi
      if "${DOCKER[@]}" exec "$MONGO_CONTAINER" mongosh \
        -u "$MONGO_APP_USERNAME" -p "$MONGO_APP_PASSWORD" \
        --authenticationDatabase "$MONGO_APP_DATABASE" --quiet --eval 'db.adminCommand({ping:1}).ok' >/dev/null 2>&1; then
        printf '✅ login user aplikasi ok\n'
      else
        bad "login MONGO_APP_USERNAME gagal — kalau password baru diubah pada volume lama, update user di DB (lihat docs/on-premise-deployment.md)"
        FAIL=$((FAIL + 1))
      fi
    else
      warn "container ${MONGO_CONTAINER} tidak jalan atau .env belum ada — lewati pemeriksaan MongoDB"
    fi
    local code
    code="$(curl -k -s -o /dev/null -w '%{http_code}' --max-time 5 https://127.0.0.1/api/health 2>/dev/null || true)"
    if [ "$code" = "200" ]; then
      printf '✅ /api/health → 200\n'
    else
      bad "/api/health → ${code:-tidak ada respons}"
      FAIL=$((FAIL + 1))
    fi
  fi

  echo "── Jaringan ───────────────────────────────────────"
  local domain resolved local_ip public_ip=""
  domain="$(domain_of)"
  if [ -n "$domain" ]; then
    resolved="$(getent hosts "$domain" | awk '{print $1}' | head -1 || true)"
    local_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)"
    public_ip="$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || true)"
    printf '   %s → %s | IP host: %s%s\n' "$domain" "${resolved:-tidak resolve}" "${local_ip:-?}" \
      "${public_ip:+ (publik: $public_ip)}"
    case "$local_ip" in
    10.* | 192.168.* | 172.1[6-9].* | 172.2[0-9].* | 172.3[01].* | "") printf '   (IP host privat — perbandingan DNS dilewati)\n' ;;
    *)
      if [ -n "$resolved" ] && [ "$resolved" != "$local_ip" ]; then
        warn "DNS tidak menunjuk ke IP host ini — Let's Encrypt akan gagal (wajar untuk self-signed/LAN)"
      fi
      ;;
    esac
    [ -z "$resolved" ] && [ -z "$public_ip" ] &&
      warn "domain tidak resolve dan tidak ada akses internet — pakai mode self-signed"
  fi

  echo ""
  if [ "$FAIL" -eq 0 ]; then
    ok "Semua pemeriksaan wajib lolos"
  else
    bad "${FAIL} pemeriksaan gagal — perbaiki sebelum 'up'"
    return 1
  fi
}

# ── dispatch ─────────────────────────────────────────────────
main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
  help | -h | --help) cmd_help ;;
  init) cmd_init "$@" ;;
  cert) cmd_cert "$@" ;;
  up) cmd_up ;;
  update) cmd_update ;;
  restart) cmd_restart "$@" ;;
  down) cmd_down ;;
  reset) cmd_reset ;;
  status) cmd_status ;;
  logs) cmd_logs "$@" ;;
  shell) cmd_shell "$@" ;;
  mongo) cmd_mongo ;;
  backup) cmd_backup "$@" ;;
  restore) cmd_restore "$@" ;;
  doctor) cmd_doctor ;;
  *)
    bad "perintah tidak dikenal: $cmd"
    echo ""
    cmd_help
    exit 2
    ;;
  esac
}

main "$@"
