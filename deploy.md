# Deploy — Vet Management System

Deploy ke VPS. Satu `docker-compose.yml` untuk semua service
(backend, frontend, mongodb, nginx) — tidak ada compose file terpisah untuk prod.

1. SSH ke server

   ssh user@your-server-ip

2. Clone projek

   git clone https://github.com/Harits19/vet-management-system
   cd vet-management-system

3. Buat .env (template: .env.example)

   cp .env.example .env
   nano .env

   Yang wajib diganti:
   - `JWT_SECRET` → string acak kuat
   - `MONGO_INITDB_ROOT_PASSWORD` & `MONGO_APP_PASSWORD` → ganti dari default dev
   - `NODE_ENV=production`, `COOKIE_SECURE=true`
   - `FRONTEND_ORIGINS` & `NEXT_PUBLIC_API_URL` → pakai domain Anda (lihat komentar di .env.example)
   - `MONGO_PORT=0.0.0.0:27017` kalau mau akses DB dari luar (mis. dev laptop)

   Catatan: tidak ada key `MONGODB_URI` — URI di-generate di kode dari
   `MONGODB_HOST` + `MONGO_APP_USERNAME`/`MONGO_APP_PASSWORD`. Di docker,
   `MONGODB_HOST=mongodb` otomatis di-set compose.

4. DNS record A → IP server Anda

5. Build & start

   bash deploy.sh

   (atau manual: `docker compose build && docker compose up -d`)

   Nginx otomatis serve frontend di `/` dan proxy API di `/api/`. Tinggal pointing DNS aja.

Catatan: untuk HTTPS, letakkan sertifikat di folder `ssl/` (gitignored) dan
sesuaikan `server_name` di `nginx.conf`. Blok 443 + redirect sudah tersedia.
