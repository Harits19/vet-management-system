# AGENTS.md — Vet Management System

Sumber kebenaran konteks repo ini (VPS & laptop). Update kalau arsitektur/env berubah.

## Project

Monorepo npm workspaces:

| Bagian   | Path                                             | Stack                                     | Port   |
| -------- | ------------------------------------------------ | ----------------------------------------- | ------ |
| Backend  | `apps/backend`                                   | Express 5 + Mongoose 8 + TypeScript (tsx) | 3001   |
| Frontend | `apps/frontend`                                  | Next.js 15 + React 19 + Ant Design        | 3002   |
| Shared   | `packages/shared`                                | tipe/schema bersama (`@vet/shared`)       | —      |
| DB       | MongoDB 7 (`mongo:7`), database `vet-management` | —                                         | 27017  |
| Proxy    | `nginx.conf` (`nginx:alpine`)                    | `/` → frontend, `/api/` → backend         | 80/443 |

Script root: `npm run dev` | `build` | `typecheck` | `deploy` (= `bash deploy.sh`).

## Deploy VPS — dua perintah

```bash
bash install-docker.sh   # sekali saja, lalu logout/login
bash deploy.sh           # build + up + terbitkan sertifikat HTTPS
```

Syarat: DNS A record domain → IP VPS, port 80 & 443 terbuka.
Login: `superadmin` / nilai `DEFAULT_USER_PASSWORD` di `.env`.

## .env

- Satu file `.env` untuk dev & produksi; template `.env.example` (tanpa komentar).
  `.env` di-gitignore (`.env*`), `.env.example` di-commit.
- Nilai `.env.example` = default yang jalan apa adanya (HTTP di localhost, HTTPS di domain).
  Di VPS, ganti 4 nilai ini: `JWT_SECRET`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_APP_PASSWORD`,
  `DEFAULT_USER_PASSWORD` (default di repo = publik, jangan dipakai untuk DB yang terbuka ke internet).
- Tidak ada key `MONGODB_URI` — URI di-generate di kode: `apps/backend/src/config/env.ts`
  (`MONGODB_HOST` + `MONGO_APP_USERNAME`/`MONGO_APP_PASSWORD`); `mongo-init.js` pakai root (authSource=admin).
- `MONGODB_HOST`: `localhost` (dev native) | `43.157.243.138` (laptop → DB prod) | `mongodb` (otomatis di-set
  docker-compose; nilai di `.env` TIDAK dipakai docker).
- `MONGO_PORT`: `127.0.0.1:27017` (aman) | `0.0.0.0:27017` (publik, kalau laptop dev perlu akses DB).
- `FRONTEND_ORIGINS` → CORS + **sumber domain** untuk `deploy.sh`/`setup-https.sh` (entri pertama).
  `CERTBOT_EMAIL` → email Let's Encrypt.
- Nilai yang mengandung spasi WAJIB dikutip (`KEY="nilai"`) — `deploy.sh` me-`source` `.env`.
- Klien API frontend pakai URL relatif (same-origin) → ganti domain cukup ubah `FRONTEND_ORIGINS`, tanpa rebuild.
- `STORE_*` → data toko untuk kop surat & rekam medis (`GET /api/config/store`).
- `OFFICE_LAT`/`OFFICE_LNG` → titik lokasi absensi (kosong = validasi lokasi mati).
- `ATTENDANCE_MODE` (`face`|`qr`|`both`, default `qr`) & `ATTENDANCE_QR_SECRET` → fallback secret QR
  (secret utama di DB, collection `attendanceqrs`, bisa di-rotate superadmin).

## Dev lokal

```bash
docker compose up -d mongodb   # mongo lokal
npm run dev                    # predev (mongo-init.js) → backend :3001 → frontend :3002
```

Frontend dev mem-proxy `/api` → `localhost:3001` (rewrite di `apps/frontend/next.config.js`).

## Produksi

- VPS `ubuntu@43.157.243.138`, repo di `/home/ubuntu/vet-management-system`,
  domain **https://wedi-animal-care.ahlabs.my.id**.
- HTTPS: certbot webroot (`certbot-webroot/`) → disalin ke `ssl/` oleh `renew-ssl.sh`;
  renewal otomatis lewat `certbot.timer` + deploy-hook `/etc/letsencrypt/renewal-hooks/deploy/vet-renew-ssl.sh`.
- `nginx.conf` domain-agnostic (`server_name _`) — tidak ada domain hardcoded di repo.
- ufw: 22, 80, 443 (+ 27017 kalau laptop dev perlu akses DB).

## Absensi

Lokasi (GPS) + metode wajah (liveness kedip) atau QR statis. Endpoint `/api/attendance`
(check-in, register-face, qr, list); superadmin dikecualikan dari absen. Detail di kode:
`apps/backend/src/routes/attendance.route.ts`, `apps/frontend/components/QRScanner.tsx`, `FaceCamera.tsx`.

## Aturan kerja

- Bahasa Indonesia + caveman mode ULTRA (aturan: `.clinerules/caveman-ultra.md`).
- Solusi minimal yang jalan > optimasi; fix sekecil mungkin.
- Di VPS: hanya ubah kode, JANGAN jalankan build/typecheck/test (verifikasi di laptop).
- Ubah nilai `.env` yang dibaca container → WAJIB `docker compose up -d` (recreate container);
  `docker restart` tidak membaca ulang env.
- File bind-mount (`nginx.conf`): edit via rename → container masih baca inode lama;
  pakai `docker compose up -d --force-recreate nginx`.
