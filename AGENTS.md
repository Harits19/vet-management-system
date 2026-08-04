# AGENTS.md — Vet Management System

Konteks untuk agent/tooling yang bekerja di repo ini (otomatis dibaca Hermes/agent tooling saat bekerja di repo ini — tidak perlu di-copy manual).
Fakta di sini adalah source of truth untuk pengembangan; update file ini kalau arsitektur/env berubah.

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
  `.env` di-gitignore; jangan commit `.env`.
- **TIDAK ADA key `MONGODB_URI`.** URI di-generate di kode:
  - Backend: `apps/backend/src/config/env.ts` → dari `MONGODB_HOST` + `MONGO_APP_USERNAME` + `MONGO_APP_PASSWORD`
    (format: `mongodb://<user>:<pass>@<host>:27017/vet-management?authSource=vet-management`).
  - `mongo-init.js` (predev) → dari `MONGO_INITDB_ROOT_USERNAME/PASSWORD` + `MONGODB_HOST` (authSource=admin).
- `MONGODB_HOST`:
  - `localhost` → dev native di mesin yang sama.
  - `mongodb` → otomatis di-set docker-compose untuk container backend; **nilai `MONGODB_HOST` di `.env` TIDAK dipakai docker**.
- `MONGO_PORT` hanya untuk bind port compose: `127.0.0.1:27017` (dev, localhost saja) / `0.0.0.0:27017` (prod, publik).
- `predev` = `node mongo-init.js` — dual-mode: mongosh (via `docker-entrypoint-initdb.d`, jalan otomatis di volume mongo baru) / mongoose (via `npm run dev`). Idempotent; menjamin user aplikasi (role `dbOwner` di `vet-management`) ada.

## Dev lokal

```bash
docker compose up -d mongodb   # mongo lokal
npm run dev                    # predev (mongo-init.js) → backend :3001 → frontend :3002
```

- Default dev: user aplikasi `vetapp`/`dev-app-password`, root `root`/`dev-root-password` (bisa di-override di `.env`).

## Produksi

- Deploy: satu `docker-compose.yml` untuk semua — `docker compose up -d` (baca `.env`), atau `npm run deploy` (deploy.sh: cek .env → build → up).
- Nginx serve frontend di `/` dan proxy API di `/api/`. Untuk HTTPS, letakkan sertifikat di folder `ssl/` (gitignored) dan pastikan `server_name` di `nginx.conf` memakai domain Anda.
- MongoDB auth aktif: root@admin (kredensial cuma di `.env` server), user aplikasi `vetapp`@`vet-management` (dbOwner).

## Konvensi kerja

- Komunikasi dalam **Bahasa Indonesia**.
- Solusi minimal yang jalan ("caveman") > optimasi; root-cause fix sekecil mungkin.
- Verifikasi (typecheck/build/test) dijalankan di mesin dev lokal, bukan di server produksi.
- Tanya dulu sebelum build Docker lama atau operasi destruktif (mis. reset DB).
