# AGENTS.md — Vet Management System

File konteks agar agent punya pengetahuan yang sama di **VPS** dan **laptop lokal**
(otomatis dibaca Hermes/agent tooling saat bekerja di repo ini — tidak perlu di-copy manual).
Fakta di sini adalah source of truth; update file ini kalau arsitektur/env berubah.

## Project

Monorepo npm workspaces:

| Bagian | Path | Stack | Port |
|---|---|---|---|
| Backend | `apps/backend` | Express 5 + Mongoose 8 + TypeScript (tsx watch) | 3001 |
| Frontend | `apps/frontend` | Next.js 15 (App Router) + React 19 + Ant Design | 3002 |
| Shared | `packages/shared` | tipe/schema bersama (`@vet/shared`) | — |
| DB | MongoDB 7 (container `mongo:7`), database `vet-management` | — | 27017 |
| Proxy | `nginx.conf` (container `nginx:alpine`) | frontend di `/`, API di `/api/` | 80/443 |

Script root (`package.json`): `npm run dev` (predev + backend + frontend via concurrently),
`npm run build`, `npm run typecheck`, `npm run deploy` (= `bash deploy.sh`).

## Aturan .env (PENTING — jangan dilanggar)

- **Satu file `.env` untuk SEMUA mode** (dev & produksi) + `.env.example` sebagai template.
  `.env` di-gitignore; kredensial asli HANYA ada di `.env` server (dan `.env` laptop). Jangan commit `.env`/`ssl/`.
- **TIDAK ADA key `MONGODB_URI`.** URI di-generate di kode:
  - Backend: `apps/backend/src/config/env.ts` → dari `MONGODB_HOST` + `MONGO_APP_USERNAME` + `MONGO_APP_PASSWORD`
    (format: `mongodb://<user>:<pass>@<host>:27017/vet-management?authSource=vet-management`).
  - `mongo-init.js` (predev) → dari `MONGO_INITDB_ROOT_USERNAME/PASSWORD` + `MONGODB_HOST` (authSource=admin).
- `MONGODB_HOST`:
  - `localhost` → dev native di mesin yang sama.
  - `43.157.243.138` → laptop dev yang menyambung ke DB produksi.
  - `mongodb` → otomatis di-set docker-compose untuk container backend; **nilai `MONGODB_HOST` di `.env` TIDAK dipakai docker**.
- **Nilai .env yang mengandung spasi WAJIB dikutip** (`KEY="nilai dengan spasi"`) — `deploy.sh` me-`source` `.env` (`set -a; source .env`), tanpa kutip bash akan error "command not found" dan deploy berhenti.
- `STORE_NAME/STORE_ADDRESS/STORE_WHATSAPP/STORE_PHONE` → data toko untuk kop surat & rekam medis (backend expose via `GET /api/config/store`, frontend pakai hook `useStoreInfo`).
- `OFFICE_LAT/OFFICE_LNG` → titik lokasi kantor untuk absensi berbasis lokasi (kosong = validasi lokasi dimatikan); `OFFICE_RADIUS_METERS` (default 200) & `ATTENDANCE_FACE_THRESHOLD` (default 0.6) → ambang radius & kecocokan wajah.
- `ATTENDANCE_QR_SECRET` → fallback secret QR absen; **secret utama disimpan di DB** (collection `attendanceqrs`, dokumen key `attendance-qr`) dan bisa di-rotate via `POST /api/attendance/qr/regenerate` — HANYA superadmin. QR lama langsung mati setelah regenerate.
- `MONGO_PORT` hanya untuk bind port compose: `127.0.0.1:27017` (dev, localhost saja) / `0.0.0.0:27017` (prod, publik).
- `predev` = `node mongo-init.js` — dual-mode: mongosh (via `docker-entrypoint-initdb.d`, jalan otomatis di volume mongo baru) / mongoose (via `npm run dev`). Idempotent; menjamin user aplikasi `vetapp` (role `dbOwner` di `vet-management`) ada.
- Nilai prod di `.env`: `NODE_ENV=production`, `COOKIE_SECURE=true`, `FRONTEND_ORIGINS=https://wedi-animal-care.ahlabs.my.id`, `NEXT_PUBLIC_API_URL=https://wedi-animal-care.ahlabs.my.id`.

## Dev lokal

```bash
docker compose up -d mongodb   # mongo lokal (Linux)
npm run docker:mongo:windows   # Windows/WSL2 + Docker Desktop (= wsl docker compose up -d mongodb)
npm run dev                    # predev (mongo-init.js) → backend :3001 → frontend :3002
```

- Laptop (Windows + WSL2 + Docker Desktop): repo di `C:\Users\harit\Documents\vet-management-system`;
  npm menjangkau docker via `wsl docker ...` (script `docker:mongo:*:windows` sudah disiapkan).
- Untuk dev laptop yang memakai DB produksi: `MONGODB_HOST=43.157.243.138` di `.env` lokal
  (template: `/home/ubuntu/laptop.env` di VPS). Server mongo bind `0.0.0.0:27017` + ufw 27017 terbuka — keputusan user.
- Default dev: user aplikasi `vetapp`/`dev-app-password`, root `root`/`dev-root-password` (bisa di-override di `.env`).

## Produksi (VPS)

- Server: `ubuntu@43.157.243.138`, repo di `/home/ubuntu/vet-management-system`.
  Domain: **http://wedi-animal-care.ahlabs.my.id** (masih HTTP-only; `nginx.conf` sudah punya blok 443 + redirect,
  tapi cert di `ssl/` gitignored → diisi manual di server).
- Deploy: satu `docker-compose.yml` untuk semua — `docker compose up -d` (baca `.env`), atau `npm run deploy` (deploy.sh: cek .env → build → up).
- User `ubuntu` anggota group docker → kalau butuh: `sg docker -c "docker compose ..."`.
- ufw: 22, 80, 443, 27017 (27017 terbuka ke semua IP — keputusan user, dipakai laptop dev).
- MongoDB auth aktif: root@admin (kredensial cuma di `.env` server), user aplikasi `vetapp`@`vet-management` (dbOwner).

## Konvensi kerja (kesepakatan user)

- Komunikasi dalam **Bahasa Indonesia**.
- **Caveman mode ULTRA WAJIB aktif di setiap session** (aturan lengkap: `.clinerules/caveman-ultra.md` — dibaca otomatis oleh Cline). Ringkas ekstrem, tanpa basa-basi; istilah teknis/kode tetap persis. Pengecualian: peringatan keamanan & konfirmasi aksi destruktif.
- Solusi minimal yang jalan ("caveman") > optimasi; root-cause fix sekecil mungkin.
- Di server/VPS: HANYA lakukan perubahan kode. JANGAN jalankan verifikasi (typecheck/build/test) — biarkan laptop lokal yang mengecek.
- Tanya dulu sebelum build Docker lama atau operasi destruktif (mis. reset DB).

## Absensi wajah + QR statis + lokasi (per 2026-08-10)

Absensi berbasis **lokasi (GPS) + metode: wajah (liveness kedip) ATAU QR statis**. Superadmin DIKECUALIKAN (tidak absen, menu tidak muncul; laporan `/list` tetap boleh). User non-superadmin tanpa wajah terdaftar → redirect otomatis ke `/dashboard/attendance/register` (hanya saat mode wajah aktif).

- **Mode via env `ATTENDANCE_MODE`**: `face` | `qr` | `both` — **default `qr`** (keputusan user 2026-08-10: QR jadi metode utama; wajah = opsi yang bisa dimatikan). `both` → Tabs di halaman absensi, default tab QR.
- **QR statis**: isi QR = `VET-ABSEN:<secret>`; secret utama di DB (collection `attendanceqrs`, fallback env `ATTENDANCE_QR_SECRET` saat DB kosong). Generate PNG server-side via `qrcode` (backend), endpoint `GET /api/attendance/qr` (**superadmin only**, PNG no-store). **`POST /api/attendance/qr/regenerate` — superadmin only** — rotate secret (randomBytes 32 → hex, simpan `{key:"attendance-qr", secret, updatedBy}` upsert), QR lama langsung mati. Cetak: halaman `/dashboard/attendance/qr` (guard superadmin + tombol Generate Ulang dengan Modal.confirm; fetch blob via `API_URL` + credentials). Scan: `jsQR` (frontend) di komponen `components/QRScanner.tsx` (facingMode environment = kamera belakang HP, auto-stop setelah decode). Validasi check-in QR: secret cocok + (kalau OFFICE_LAT/LNG terisi) GPS device ≤ radius.
- **Stack wajah**: `@vladmandic/face-api` + `@tensorflow/tfjs` (client-side browser). Model weights OFFLINE di `apps/frontend/public/models/face-api/` (tiny_face_detector + face_landmark_68 + face_recognition, ±7MB, di-commit). Loader: `apps/frontend/lib/face.ts`; komponen kamera: `apps/frontend/components/FaceCamera.tsx` (deteksi tiap 180ms + overlay kotak; liveness = Eye Aspect Ratio 68 landmark, wajib ≥1 kedip).
- **Backend**: model `Attendance` (userId, **method face|qr**, type in|out, timestamp, date YYYY-MM-DD zona WIB UTC+7 via `localDateString` — container ber-TZ UTC), `UserModel.faceDescriptor` (128-d) + `faceRegisteredAt`. Endpoint `/api/attendance`: `GET /config`, `GET /status` (hasFace + todayIn/Out + method), `GET /me?date=`, `POST /register-face`, `POST /check-in` (method face: descriptor+liveness; method qr: qrSecret), `GET /list` (**superadmin**), `GET /qr` (**superadmin**), `POST /qr/regenerate` (**superadmin**). Guard `excludeSuperadmin` → 403. `registerFace` ditolak 400 saat mode wajah nonaktif.
- **Role (per 2026-08-10)**: role `admin` DIHAPUS — hanya `superadmin | cashier | doctor` (shared `userRoleEnum`, model enum, semua `authorize(...)` disesuaikan, seed tanpa Admin Toko, user admin existing dihapus dari DB). Manajemen user (`/api/users`) & QR absensi → superadmin only.
- **Validasi check-in (server)**: method wajib aktif sesuai mode → (face) euclidean descriptor ≤ `ATTENDANCE_FACE_THRESHOLD` (0.6) + `livenessPassed === true` (flag client; server tak bisa buktikan anti video-replay) / (qr) secret `VET-ABSEN:<env>` → haversine ≤ `OFFICE_RADIUS_METERS` (kalau `OFFICE_LAT/LNG` terisi; kosong = dimatikan) → cek duplikat (in sekali/hari, out butuh in dulu).
- **Frontend**: `/dashboard/attendance` (status hari ini + panel metode + tombol Masuk/Pulang + riwayat + link cetak QR utk superadmin), `/dashboard/attendance/register` (daftar wajah; daftar ulang = ganti; alert saat mode wajah nonaktif), `/dashboard/attendance/qr` (cetak + generate ulang QR — superadmin), `/dashboard/attendance/history` (riwayat absen SEMUA karyawan — superadmin; filter **rentang tanggal** startDate/endDate/metode/tipe/search nama; `GET /api/attendance/list?startDate&endDate&method&type&search`). Menu "Absensi" (Clock) untuk semua role non-superadmin; superadmin: "QR Absensi" + "Riwayat Absen" + "Manajemen User".
- `.env`: `ATTENDANCE_MODE` (qr), `ATTENDANCE_QR_SECRET`, `OFFICE_LAT`, `OFFICE_LNG`, `OFFICE_RADIUS_METERS` (200), `ATTENDANCE_FACE_THRESHOLD` (0.6) — diteruskan docker-compose. Browser butuh HTTPS/localhost untuk kamera & GPS (domain prod sudah HTTPS). **PITFALL: ganti nilai .env absensi → WAJIB `docker compose up -d` (recreate container); `docker restart` TIDAK re-read env (env container immutable).**
- Dependency baru: backend `qrcode` (+`@types/qrcode`), frontend `jsQR`. Shared `@vet/shared` DIUBAH (role enum) — rebuild dist wajib (frontend resolve via dist).

## Instance PORTOFOLIO (dev-animal-care.ahlabs.my.id) — per 2026-08-13

Instance demo/portofolio di VPS SAMA, terpisah total dari produksi:

- Lokasi: `/home/ubuntu/dev-animal-care/` (copy repo, tanpa `.git`/`node_modules`/`.env`/`ssl`; update kode = rsync ulang dari repo utama, kecuali `docker-compose.yml` & `.env` yang khusus dev).
- **DB terpisah**: `vet-management-dev` (container `vetdev-mongodb`, port host `127.0.0.1:27018`), root `rootdev`, app user `vetapp-dev` — semua nilai di `.env` dev.
- **Tanpa nginx sendiri**: nginx produksi (repo utama) yang route domain ini. Server block `dev-animal-care.ahlabs.my.id` di `nginx.conf` utama → `vetdev-frontend:3002` / `vetdev-backend:3001` (DNS internal). Stack dev join network docker prod (`vet-management-system_default`, external) — TIDAK lewat port host (ufw host cuma buka 22/80/443/27017). `resolver 127.0.0.11` + `proxy_pass` variabel → kalau stack dev mati nginx tetap start (502), PROD tidak terpengaruh.
- **Kode mendukung multi-DB**: nama DB tidak lagi hardcoded — `MONGO_APP_DATABASE` (default `vet-management`, dipakai `mongo-init.js`, `env.ts`, `MONGO_INITDB_DATABASE` di compose). Prod tanpa key ini = tidak berubah.
- **HTTPS (per 2026-08-13)**: cert Let's Encrypt `dev-animal-care.ahlabs.my.id` (webroot `/var/www/certbot`, cert di `ssl-dev/` — gitignored). Nginx.conf: blok 80 = challenge + redirect 301, blok 443 = proxy. `.env` dev: `COOKIE_SECURE=true`, `FRONTEND_ORIGINS`/`NEXT_PUBLIC_API_URL` = https. **Renewal otomatis**: certbot.timer (systemd) + `deploy_hook` di `/etc/letsencrypt/renewal/dev-animal-care.ahlabs.my.id.conf` → `renew-ssl.sh` (copy ke `ssl/`+`ssl-dev/`, reload nginx). Login demo: `superadmin` / `Demo2026!` (seed otomatis, `ENABLE_SEED=true`).
- Deploy dev: `cd /home/ubuntu/dev-animal-care && docker compose up -d --build` (atau `bash deploy.sh`). **PITFALL inode (PENTING)**: edit `nginx.conf`/file yang di-bind-mount dengan tool yang menulis via rename → container tetap baca file LAMA (mount ke inode lama). Wajib `docker compose up -d --force-recreate nginx` — `docker compose restart nginx` TIDAK cukup.
- DNS: A record `dev-animal-care.ahlabs.my.id` → `43.157.243.138` (di panel DNS ahlabs.my.id).
