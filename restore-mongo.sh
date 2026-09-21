#!/bin/bash

# Hentikan eksekusi jika terjadi error
set -e

# ==================== KONFIGURASI ====================
ENV_FILE=".env"
BACKUP_DIR="backup"
# ======================================================

echo "=== Memulai Proses Restore MongoDB ==="

# 1. Cek dan muat variabel dari file .env
if [ -f "$ENV_FILE" ]; then
    echo "✔ Membaca file $ENV_FILE..."
    # Export variabel dari .env (mengabaikan baris kosong & komentar)
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "❌ Error: File '$ENV_FILE' tidak ditemukan di root project!"
    exit 1
fi

# 2. Parsing Port & Host dari .env
# Jika MONGO_PORT diset '127.0.0.1:27017' atau '0.0.0.0:27017', ambil port-nya saja (27017)
PORT_ONLY=$(echo "${MONGO_PORT:-27017}" | awk -F':' '{print $NF}')
HOST="${MONGODB_HOST:-localhost}"
DB_NAME="${MONGO_APP_DATABASE:-vet-management}"

# Menggunakan User Root/Admin untuk proses Restore
ROOT_USER="${MONGO_INITDB_ROOT_USERNAME}"
ROOT_PASS="${MONGO_INITDB_ROOT_PASSWORD}"

echo "--------------------------------------------------"
echo " Host Target : $HOST:$PORT_ONLY"
echo " Database    : $DB_NAME"
echo "--------------------------------------------------"

# 3. Validasi Tools mongorestore
if ! command -v mongorestore &> /dev/null; then
    echo "❌ Error: 'mongorestore' tidak ditemukan. Harap install 'mongodb-database-tools'."
    exit 1
fi

# 4. Cari File/Folder Backup di folder 'backup/'
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Folder '$BACKUP_DIR/' tidak ditemukan di root project!"
    exit 1
fi

# Mengambil file/folder backup terbaru atau yang tersedia di folder backup/
# Mengabaikan file .gitkeep atau hidden files
BACKUP_TARGET=$(ls -td $BACKUP_DIR/* 2>/dev/null | grep -v "\.gitkeep" | head -n 1)

if [ -z "$BACKUP_TARGET" ]; then
    echo "❌ Error: Tidak ada file/folder backup ditemukan di dalam folder '$BACKUP_DIR/'!"
    exit 1
fi

echo "✔ Menggunakan file/folder backup: $BACKUP_TARGET"

# 5. Menyiapkan Parameter Command mongorestore
ARGS=(
    "--host=$HOST"
    "--port=$PORT_ONLY"
    "--drop" # Menghapus koleksi lama agar tidak bentrok/duplikat
)

# Jika variabel root username & password ada di .env, tambahkan auth
if [ -n "$ROOT_USER" ] && [ -n "$ROOT_PASS" ]; then
    ARGS+=(
        "--username=$ROOT_USER"
        "--password=$ROOT_PASS"
        "--authenticationDatabase=admin"
    )
fi

# Specifikasikan database target
ARGS+=("--db=$DB_NAME")

# 6. Eksekusi Restore berdasarkan tipe file/folder di backup/
echo "=== Melakukan Restore Data ==="

if [ -d "$BACKUP_TARGET" ]; then
    echo "Metode: Restore dari direktori..."
    # Jika di dalam folder backup ada subfolder nama database, sesuaikan lokasinya
    if [ -d "$BACKUP_TARGET/$DB_NAME" ]; then
        mongorestore "${ARGS[@]}" "$BACKUP_TARGET/$DB_NAME"
    else
        mongorestore "${ARGS[@]}" "$BACKUP_TARGET"
    fi

elif [[ "$BACKUP_TARGET" == *.tar.gz ]]; then
    echo "Metode: Extract dan restore dari file .tar.gz..."
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$BACKUP_TARGET" -C "$TEMP_DIR"
    
    if [ -d "$TEMP_DIR/$DB_NAME" ]; then
        mongorestore "${ARGS[@]}" "$TEMP_DIR/$DB_NAME"
    else
        mongorestore "${ARGS[@]}" "$TEMP_DIR"
    fi
    rm -rf "$TEMP_DIR"

elif [[ "$BACKUP_TARGET" == *.gz ]]; then
    echo "Metode: Restore langsung dari file .gz..."
    mongorestore "${ARGS[@]}" --archive="$BACKUP_TARGET" --gzip

else
    echo "❌ Error: Format file di '$BACKUP_TARGET' tidak dikenali (Gunakan folder, .tar.gz, atau .gz)."
    exit 1
fi

echo ""
echo "=========================================================="
echo " 🎉 Restore MongoDB ke database '$DB_NAME' berhasil!"
echo "=========================================================="