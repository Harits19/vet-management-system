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
- **QR statis**: isi QR = `VET-ABSEN:<ATTENDANCE_QR_SECRET>` (secret dari env, default dev `vet-attendance-2026` — ganti di prod = QR lama mati). Generate PNG server-side via `qrcode` (backend), endpoint `GET /api/attendance/qr` (authorize admin/superadmin, PNG no-store). Cetak: halaman `/dashboard/attendance/qr` (fetch blob via `API_URL` + credentials — export `API_URL` baru di `context/auth.tsx`; <img> polos gagal cross-origin dev). Scan: `jsQR` (frontend) di komponen `components/QRScanner.tsx` (facingMode environment = kamera belakang HP, auto-stop setelah decode). Validasi check-in QR: secret cocok + (kalau OFFICE_LAT/LNG terisi) GPS device ≤ radius.
- **Stack wajah**: `@vladmandic/face-api` + `@tensorflow/tfjs` (client-side browser). Model weights OFFLINE di `apps/frontend/public/models/face-api/` (tiny_face_detector + face_landmark_68 + face_recognition, ±7MB, di-commit). Loader: `apps/frontend/lib/face.ts`; komponen kamera: `apps/frontend/components/FaceCamera.tsx` (deteksi tiap 180ms + overlay kotak; liveness = Eye Aspect Ratio 68 landmark, wajib ≥1 kedip).
- **Backend**: model `Attendance` (userId, **method face|qr**, type in|out, timestamp, date YYYY-MM-DD zona WIB UTC+7 via `localDateString` — container ber-TZ UTC), `UserModel.faceDescriptor` (128-d) + `faceRegisteredAt`. Endpoint `/api/attendance`: `GET /config`, `GET /status` (hasFace + todayIn/Out + method), `GET /me?date=`, `POST /register-face`, `POST /check-in` (method face: descriptor+liveness; method qr: qrSecret), `GET /list` (admin/superadmin), `GET /qr` (admin/superadmin). Guard `excludeSuperadmin` → 403. `registerFace` ditolak 400 saat mode wajah nonaktif.
- **Validasi check-in (server)**: method wajib aktif sesuai mode → (face) euclidean descriptor ≤ `ATTENDANCE_FACE_THRESHOLD` (0.6) + `livenessPassed === true` (flag client; server tak bisa buktikan anti video-replay) / (qr) secret `VET-ABSEN:<env>` → haversine ≤ `OFFICE_RADIUS_METERS` (kalau `OFFICE_LAT/LNG` terisi; kosong = dimatikan) → cek duplikat (in sekali/hari, out butuh in dulu).
- **Frontend**: `/dashboard/attendance` (status hari ini + panel metode + tombol Masuk/Pulang + riwayat + link cetak QR utk admin), `/dashboard/attendance/register` (daftar wajah; daftar ulang = ganti; alert saat mode wajah nonaktif), `/dashboard/attendance/qr` (cetak QR — admin/superadmin). Menu "Absensi" (Clock) untuk semua role non-superadmin.
- `.env`: `ATTENDANCE_MODE` (qr), `ATTENDANCE_QR_SECRET`, `OFFICE_LAT`, `OFFICE_LNG`, `OFFICE_RADIUS_METERS` (200), `ATTENDANCE_FACE_THRESHOLD` (0.6) — diteruskan docker-compose. Browser butuh HTTPS/localhost untuk kamera & GPS (domain prod sudah HTTPS).
- Dependency baru: backend `qrcode` (+`@types/qrcode`), frontend `jsQR`. Tanpa shared schema — `@vet/shared` tidak tersentuh, tidak perlu rebuild.
