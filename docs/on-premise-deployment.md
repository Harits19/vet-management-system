# Deployment On-Premise (Docker)

Panduan menjalankan Vet Management System di server sendiri (on-premise / VPS / PC kantor)
memakai Docker. Semua langkah bisa diselesaikan tanpa menyentuh kode: satu file `.env`,
satu helper `scripts/vet-deploy.sh`, dan `docker compose`.

Instalasi cepat 6 perintah: `docs/deploy-quickstart.md`.

Target pembaca: operator/IT yang memasang dan merawat instalasi, bukan developer.

---

## 1. Arsitektur

Empat container dari `docker-compose.yml`, satu jaringan internal Docker:

| Container      | Image                    | Port host       | Peran                                                         |
| -------------- | ------------------------ | --------------- | ------------------------------------------------------------- |
| `vet-nginx`    | `nginx:alpine`           | 80, 443         | Pintu masuk. TLS terminate, `/` → frontend, `/api/` → backend |
| `vet-frontend` | build lokal (Next.js 15) | internal 3002   | UI, SSR                                                       |
| `vet-backend`  | build lokal (Express 5)  | internal 3001   | REST API, JWT, akses MongoDB                                  |
| `vet-mongodb`  | `mongo:7`                | `${MONGO_PORT}` | Database `vet-management` (volume `mongodb_data`)             |

Hanya nginx yang terekspos ke luar. Frontend & backend tidak punya port host — jadi tidak ada
cara klien menembus API langsung tanpa lewat nginx. MongoDB default bind ke `127.0.0.1:27017`
(`MONGO_PORT`), aman untuk server yang menghadap internet.

Alur request: browser → nginx:443 → `/api/*` ke backend:3001, sisanya ke frontend:3002.
Klien API frontend memakai URL relatif (same-origin), jadi **ganti domain cukup ubah
`FRONTEND_ORIGINS` di `.env`, tanpa rebuild**.

Data yang persisten:

| Lokasi                | Isi                               | Catatan                           |
| --------------------- | --------------------------------- | --------------------------------- |
| volume `mongodb_data` | seluruh database `vet-management` | ikut terhapus oleh `reset`        |
| `ssl/`                | `fullchain.pem`, `privkey.pem`    | di-gitignore, `chmod 600` privkey |
| `backup/`             | hasil `vet-deploy.sh backup`      | di-gitignore                      |
| `certbot-webroot/`    | jalur HTTP-01 Let's Encrypt       | hanya dipakai mode Let's Encrypt  |

---

## 2. Prasyarat

**Hardware (minimum)** — build frontend Next.js paling rakus:

| Sumber daya | Minimum          | Rekomendasi                      |
| ----------- | ---------------- | -------------------------------- |
| CPU         | 2 core           | 4 core                           |
| RAM         | 2 GB + swap 2 GB | 4 GB                             |
| Disk        | 20 GB            | 40 GB (build cache + backup)     |
| Jaringan    | LAN + IP statis  | port 80/443 bisa dijangkau klien |

**Software** — Ubuntu 22.04/24.04 LTS (atau Debian), Docker Engine + plugin `docker compose`.
Belum ada Docker? `bash install-docker.sh` (sekali), lalu **logout/login** supaya user masuk grup
`docker`. Cek: `docker compose version`.

**Jaringan**

- Klien dijangkau server pada port 80/443.
- Domain (opsional, hanya untuk HTTPS tepercaya):
  - domain publik + A record → IP server, port 80 terbuka dari internet → mode Let's Encrypt;
  - tanpa internet / LAN tertutup → mode self-signed (bagian 4.2). Tidak perlu DNS.
- Server di belakang NAT: forward 80/443 dari router ke IP server.

**Sertifikat wajib ada sebelum nginx start** — `nginx.conf` menunjuk
`/etc/nginx/ssl/fullchain.pem`. Kalau file belum ada, container nginx akan restart-loop.
Buat sertifikat dulu (bagian 4), baru `up`.

---

## 3. Instalasi cepat

```bash
git clone <url-repo> vet-management-system
cd vet-management-system

bash install-docker.sh                            # sekali saja, lalu logout/login
bash scripts/vet-deploy.sh init <domain-atau-IP> <email-admin>   # buat .env + secret acak
bash scripts/vet-deploy.sh cert self-signed       # atau: cert lets-encrypt
bash scripts/vet-deploy.sh doctor                 # preflight check, harus lolos
bash scripts/vet-deploy.sh up                     # build + start + tunggu sehat
```

`init` melakukan:

- menyalin `.env.example` → `.env`;
- mengisi `FRONTEND_ORIGINS` (dipakai CORS + sumber domain sertifikat) dan `CERTBOT_EMAIL`;
- **generate password/secret acak** untuk `JWT_SECRET`, `MONGO_INITDB_ROOT_PASSWORD`,
  `MONGO_APP_PASSWORD`, `DEFAULT_USER_PASSWORD` — nilai default repo tidak dipakai lagi;
- `chmod 600 .env` dan menampilkan password login awal (`superadmin` / `DEFAULT_USER_PASSWORD`).

Password itu ditampilkan **sekali**. Catat di password manager. Lupa? Lihat
`grep DEFAULT_USER_PASSWORD .env`.

Setelah `up` selesai: buka `https://<domain>`, login `superadmin`. Saat pertama kali start,
`ENABLE_SEED=true` membuat user awal (`superadmin`, `kasir1`, `kasir2`, `dokter`) dengan
`DEFAULT_USER_PASSWORD` — hanya kalau koleksi user masih kosong.

Jalur pintas (kompatibel dengan versi lama): `bash deploy.sh` = `cert lets-encrypt` + `up`
(butuh domain publik, karena memakai webroot Let's Encrypt). Untuk on-prem tanpa internet pakai
`SELF_SIGNED=1 bash deploy.sh`.

---

## 4. Sertifikat HTTPS

### 4.1 Mode Let's Encrypt (domain publik)

```bash
bash scripts/vet-deploy.sh cert lets-encrypt
```

Script `setup-https.sh` akan: memasang `certbot`, mengisi self-signed sementara supaya nginx bisa
start, memastikan `http://<domain>/.well-known/acme-challenge/...` bisa diakses **dari internet**,
lalu menerbitkan sertifikat. Renewal otomatis lewat `certbot.timer` + deploy-hook
`/etc/letsencrypt/renewal-hooks/deploy/vet-renew-ssl.sh` yang menyalin cert ke `ssl/` dan reload
nginx.

Gagal di langkah challenge HTTP-01? DNS belum mengarah ke server, port 80 tertutup/firewall, atau
ada proxy lain. Pakai `-s`/`--staging` saat uji coba supaya tidak kena rate-limit Let's Encrypt.

### 4.2 Mode self-signed (LAN / tanpa internet)

```bash
bash scripts/vet-deploy.sh cert self-signed            # pakai domain dari FRONTEND_ORIGINS
bash scripts/vet-deploy.sh cert self-signed 192.168.1.10
bash scripts/vet-deploy.sh cert self-signed 192.168.1.10 --force   # timpa yang ada
```

Sertifikat berlaku 3650 hari (`SELF_SIGNED_DAYS`), `subjectAltName` memuat domain tersebut,
`localhost`, `127.0.0.1`, dan IP host ini. Browser akan **memperingatkan sertifikat tidak
tepercaya** — itu normal (tetap terenkripsi, hanya identitas server tidak diverifikasi CA publik).

Pilihan kalau peringatan itu mengganggu:

- pakai DNS internal + terbitkan sertifikat dari CA internal kantor, lalu salin ke `ssl/`
  (`fullchain.pem` + `privkey.pem`, reload nginx);
- pasang sertifikat sebagai trusted root di setiap klien.

Cek masa berlaku: `bash scripts/vet-deploy.sh cert status`.

---

## 5. Skenario jaringan on-premise

| Skenario                              | Sertifikat                                  | Akses klien                                |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Server punya IP publik + domain       | Let's Encrypt                               | `https://vet.klinik.id`                    |
| LAN murni, tanpa DNS                  | self-signed                                 | `https://192.168.1.10` (terima peringatan) |
| LAN + DNS lokal (router / Pi-hole)    | self-signed atau CA internal                | `https://vet.klinik.local`                 |
| Di belakang NAT / port-forward router | Let's Encrypt (butuh port 80 dari internet) | `https://vet.klinik.id`                    |

Catatan praktis:

- `CERTBOT_EMAIL` dan domain pertama `FRONTEND_ORIGINS` menentukan nama di sertifikat. Ubah di
  `.env`, lalu `bash scripts/vet-deploy.sh cert ...` dan `up` lagi.
- Ganti domain/IP setelah instalasi berjalan: ubah `FRONTEND_ORIGINS`, terbitkan sertifikat baru,
  lalu `docker compose up -d --force-recreate nginx` (nginx membaca `ssl/` saat start).
- Frontend memakai URL relatif, jadi tidak ada URL backend yang di-hardcode di bundle.

---

## 6. Perintah operasional

```bash
bash scripts/vet-deploy.sh help
```

| Perintah                                     | Fungsi                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `doctor`                                     | Cek prasyarat: RAM/disk, docker, isi `.env`, port 80/443, sertifikat, login MongoDB, `/api/health`, DNS. Read-only. |
| `init <domain> [email]`                      | Buat `.env` + generate secret (`FORCE=1` untuk regenerate)                                                          |
| `cert self-signed \| lets-encrypt \| status` | Sertifikat TLS                                                                                                      |
| `up`                                         | `docker compose build` + `up -d` + recreate nginx + tunggu `/api/health` 200                                        |
| `update`                                     | `git pull --ff-only` lalu `up` (menolak kalau ada perubahan lokal)                                                  |
| `restart [service]`                          | Restart container — **tidak** membaca ulang `.env`                                                                  |
| `status`                                     | Daftar container + cek `/api/health`                                                                                |
| `logs [service]`                             | Ikuti log (Ctrl+C keluar)                                                                                           |
| `shell <service>`                            | `sh` ke container (`mongodb`, `backend`, `frontend`, `nginx`)                                                       |
| `mongo`                                      | `mongosh` interaktif ke database aplikasi                                                                           |
| `backup [label]`                             | Dump MongoDB ke `backup/vet-<tanggal>-<label>.archive.gz`                                                           |
| `restore <file>`                             | Restore archive (non-destruktif; `RESTORE_DROP=1` = hapus dulu)                                                     |
| `down`                                       | Hentikan + hapus container (volume/data tetap)                                                                      |
| `reset`                                      | ⚠️ hapus container **dan** volume MongoDB (data hilang, perlu konfirmasi ketik nama DB)                             |

Variabel opsional: `BACKUP_KEEP` (default 7), `HEALTH_TIMEOUT` (90), `SELF_SIGNED_DAYS` (3650),
`MONGO_CONTAINER` (untuk uji coba ke container lain), `COMPOSE_FILE`.

Tersedia juga lewat npm: `npm run deploy:doctor`, `npm run deploy:backup`, `npm run deploy:status`.

---

## 7. Update aplikasi & rollback

```bash
bash scripts/vet-deploy.sh backup pra-update   # selalu backup dulu
bash scripts/vet-deploy.sh update              # git pull --ff-only + build + up
```

`update` berhenti kalau ada perubahan lokal belum di-commit (hindari menimpa perubahan manual
di server). Kalau memang ingin paksa: `FORCE=1 bash scripts/vet-deploy.sh update`.

Rollback cepat:

```bash
git log --oneline -10
git checkout <commit-atau-tag-yang-terakhir-sehat>
bash scripts/vet-deploy.sh up
```

Kalau perlu kembali ke kode cabang utama: `git checkout main && git pull --ff-only` lalu `up`.
Restore database hanya kalau ada migrasi data yang merusak (bagian 8) — bukan langkah rutin
rollback kode.

---

## 8. Backup & restore

**Backup** (mongodump dari dalam container, tidak perlu tools MongoDB di host):

```bash
bash scripts/vet-deploy.sh backup
# ✅ Backup valid: backup/vet-20261008-103000.archive.gz (2.3M)
```

Script memverifikasi arsip (ukuran > 0 + `gzip -t`) dan menyimpan hanya `BACKUP_KEEP` arsip
terbaru (`BACKUP_KEEP=14` untuk retensi 2 minggu). Jadwal harian lewat cron:

```cron
15 1 * * * cd /home/ubuntu/vet-management-system && BACKUP_KEEP=14 bash scripts/vet-deploy.sh backup >> backup/backup.log 2>&1
```

Salin hasil backup keluar dari server (disk lokal bukan backup sejati):

```bash
rsync -av backup/ user@nas:/srv/vet-backup/
```

**Restore** default **non-destruktif**: data lama dipertahankan, dokumen dengan `_id` yang sudah ada
dilewati (muncul error `duplicate key` di log, restore tetap lanjut).

```bash
bash scripts/vet-deploy.sh restore backup/vet-20261008-103000.archive.gz
```

Kalau memang ingin menimpa koleksi lama (mis. restore ke server baru atau pemulihan bencana):

```bash
RESTORE_DROP=1 bash scripts/vet-deploy.sh restore backup/vet-20261008-103000.archive.gz
```

`RESTORE_DROP=1` menghapus koleksi sebelum restore dan meminta konfirmasi dengan mengetik nama
database. Uji jalur restore ini minimal sekali sebelum benar-benar dibutuhkan.

---

## 9. Rutinitas perawatan

- `status` / `logs backend` saat ada keluhan pengguna; `doctor` setelah reboot server.
- Update ringan bulanan: `git pull` → `up`, atau `update`.
- Cek disk: `df -h`, `docker system df`. Build lama dibersihkan dengan `docker image prune -f`.
- Log container memakai driver `json-file` tanpa batas ukuran. Kalau log membengkak, set
  `logging: {driver: json-file, options: {max-size: "10m", max-file: "3"}}` per service di
  `docker-compose.yml`.
- Verifikasi backup bulanan: restore ke container MongoDB sementara (lihat `MONGO_CONTAINER`),
  jangan ke database produksi.

---

## 10. Troubleshooting

| Gejala                                                               | Penyebab umum                                                                                 | Tindakan                                                                                                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| nginx restart-loop, log `cannot load certificate`                    | `ssl/fullchain.pem` belum ada                                                                 | `bash scripts/vet-deploy.sh cert self-signed` (atau `lets-encrypt`) lalu `up`                                                              |
| Halaman 502 Bad Gateway                                              | backend/frontend belum siap atau crash                                                        | `logs backend`, `logs frontend`, tunggu health check                                                                                       |
| `/api/health` 200 tapi halaman 502                                   | frontend crash loop                                                                           | `logs frontend` (biasanya build lama / OOM)                                                                                                |
| `cert lets-encrypt` gagal di HTTP-01                                 | DNS belum mengarah ke server, port 80 tertutup, proxy lain memakai port 80                    | cek `getent hosts <domain>`, firewall, `docker compose logs nginx`                                                                         |
| Browser: "sertifikat tidak tepercaya"                                | mode self-signed                                                                              | normal; pasang CA internal atau terima pengecualian                                                                                        |
| Perubahan `.env` tidak berefek                                       | `docker restart` tidak membaca ulang env                                                      | `docker compose up -d` (recreate container)                                                                                                |
| Perubahan `nginx.conf` tidak berefek                                 | file bind-mount: container masih memegang inode lama                                          | `docker compose up -d --force-recreate nginx`                                                                                              |
| Login MongoDB user aplikasi gagal setelah ganti `MONGO_APP_PASSWORD` | `mongo-init.js` hanya membuat user kalau belum ada; volume lama masih menyimpan password lama | perbarui di DB: `bash scripts/vet-deploy.sh mongo` lalu `db.getSiblingDB('vet-management').updateUser('vetapp', {pwd: '<password-baru>'})` |
| `next build` mati / OOM saat `up`                                    | RAM < 2 GB tanpa swap, build paralel                                                          | tambah swap, build ulang, atau build di mesin lain lalu `docker image` transfer                                                            |
| Disk penuh saat build                                                | cache image + backup menumpuk                                                                 | `docker system prune -f`, turunkan `BACKUP_KEEP`, pindahkan backup ke NAS                                                                  |
| Absen QR/wajah tidak jalan                                           | `ATTENDANCE_MODE` salah atau secret beda                                                      | cek `ATTENDANCE_MODE` (`qr`/`face`/`both`) di `.env`, `ATTENDANCE_QR_SECRET` harus sama dengan yang ada di DB/QR tercetak                  |

Debug cepat: `bash scripts/vet-deploy.sh doctor` memberi ringkasan semua hal di atas sekaligus.

---

## 11. Hardening sebelum dipakai produksi

1. **Secret**: `init` sudah generate acak. Pastikan `JWT_SECRET`,
   `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_APP_PASSWORD`, `DEFAULT_USER_PASSWORD` bukan nilai
   default repo (`doctor` memperingatkan kalau masih default).
2. **`.env`** `chmod 600`, jangan pernah di-commit (`.gitignore` menutup `.env*`).
3. **MongoDB jangan terbuka**: `MONGO_PORT=127.0.0.1:27017` (default aman). Ubah ke
   `0.0.0.0:27017` hanya sementara dan hanya di LAN tepercaya.
4. **Firewall**: `sudo ufw allow 22,80,443/tcp` lalu `sudo ufw enable`.
5. **Seed**: setelah user awal dibuat, set `ENABLE_SEED=false` supaya tidak ada user default baru.
   Ganti password `superadmin`, `kasir1`, `kasir2`, `dokter` dari UI karena semuanya berasal dari
   `DEFAULT_USER_PASSWORD`.
6. **`COOKIE_SECURE=true`** (butuh HTTPS) agar cookie JWT tidak dikirim lewat koneksi polos.
7. Ganti `ATTENDANCE_QR_SECRET` default dan cetak ulang QR absensi (isi QR =
   `VET-ABSEN:<secret>`).

---

## 12. Referensi file

| File                    | Isi                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `scripts/vet-deploy.sh` | Helper utama: doctor/init/cert/up/update/backup/restore/ops                          |
| `docker-compose.yml`    | Definisi 4 service + volume + env yang diteruskan ke container                       |
| `deploy.sh`             | Jalur pintas lama (Let's Encrypt + up); `SELF_SIGNED=1` untuk on-prem tanpa internet |
| `setup-https.sh`        | Certbot webroot HTTP-01 + hook renewal                                               |
| `renew-ssl.sh`          | Salin cert Let's Encrypt ke `ssl/` + reload nginx                                    |
| `restore-mongo.sh`      | Restore lama (butuh `mongorestore` di host + folder `backup/`)                       |
| `nginx.conf`            | TLS + routing `/` → frontend, `/api/` → backend                                      |
| `.env.example`          | Template semua variabel (nilai default = jalan apa adanya)                           |
| `AGENTS.md`             | Konteks repo, aturan kerja, detail nilai `.env`                                      |
