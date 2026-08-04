# Vet Management System

Sistem manajemen klinik hewan terintegrasi: rekam medis, konsultasi dokter, manajemen
pasien & pemilik (customer), stok obat/barang, jasa layanan, dan transaksi dokter —
dalam satu monorepo.

## Fitur

- 🐾 **Rekam medis & konsultasi** — catat pemeriksaan fisik, diagnosis (SOAP), resep,
  dan tindakan per pasien; riwayat lengkap tersimpan per hewan.
- 👤 **Manajemen pasien & pemilik** — data hewan (spesies, ras, umur) terhubung dengan
  customer/pemilik.
- 💊 **Master produk** — obat, barang, dan jasa; stok otomatis berkurang saat dipakai
  dalam konsultasi dan dikembalikan saat dihapus.
- 💳 **Transaksi dokter** — transaksi `vet` dari rekam medis, dukungan utang/DP dan
  pembayaran bertahap.
- 📊 **Dashboard** — statistik transaksi, produk stok menipis, dan ringkasan lainnya.
- 🔄 **Sinkronisasi data klinik** — impor data pasien, rekam medis, produk, dan layanan
  dari file Excel.
- 🔐 **Role-based access** — `superadmin`, `admin`, `doctor`, `cashier`.

## Teknologi

| Bagian | Stack |
|---|---|
| Backend | Express 5, Mongoose 8, TypeScript |
| Frontend | Next.js 15 (App Router), React 19, Ant Design |
| Shared | `@vet/shared` — tipe & schema bersama (zod) |
| Database | MongoDB 7 |
| Proxy | Nginx (frontend di `/`, API di `/api/`) |

## Struktur Monorepo

```
apps/
  backend/    # API Express (port 3001)
  frontend/   # Web Next.js (port 3002)
packages/
  shared/     # Tipe & schema bersama @vet/shared
```

## Menjalankan (Development)

Prasyarat: Node.js 20+, Docker (untuk MongoDB).

```bash
# 1. Salin template env
cp .env.example .env

# 2. Jalankan MongoDB (docker)
docker compose up -d mongodb

# 3. Install dependencies & jalankan dev (backend :3001 + frontend :3002)
npm install
npm run dev
```

`predev` otomatis menjalankan `mongo-init.js` yang menjamin user aplikasi MongoDB ada.

> Catatan: tidak ada key `MONGODB_URI` — URI di-generate di kode dari
> `MONGODB_HOST` + `MONGO_APP_USERNAME` + `MONGO_APP_PASSWORD` (lihat `apps/backend/src/config/env.ts`).

## Deployment

Satu `docker-compose.yml` untuk semua service:

```bash
cp .env.example .env   # isi nilai produksi
bash deploy.sh         # atau: docker compose up -d --build
```

Untuk HTTPS: letakkan sertifikat di folder `ssl/` (gitignored) dan sesuaikan
`server_name` di `nginx.conf`. Detail lengkap di [`deploy.md`](deploy.md).

## Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Backend + frontend (concurrently) |
| `npm run build` | Build shared → backend → frontend |
| `npm run typecheck` | Typecheck shared + backend |
| `npm run deploy` | `bash deploy.sh` (build + up) |

## Lisensi

[MIT](LICENSE) © 2026 Abdullah Harits
