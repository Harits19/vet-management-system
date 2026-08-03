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
- Solusi minimal yang jalan ("caveman") > optimasi; root-cause fix sekecil mungkin.
- Jangan jalankan verifikasi (typecheck/build/test) kecuali diminta.
- Tanya dulu sebelum build Docker lama atau operasi destruktif (mis. reset DB).
