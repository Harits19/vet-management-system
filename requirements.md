# 📋 Requirements — Sistem Kasir Terintegrasi Toko Hewan & Praktek Dokter Hewan

## 1. Ringkasan Proyek

Sistem kasir yang terintegrasi penuh dengan data pasien hewan, pemilik (customer/member), dan rekam medis. Digunakan oleh **2 kasir** (transaksi penjualan produk) dan **1 dokter hewan** (pencatatan rekam medis & transaksi dokter). Dibangun sebagai **monorepo** dengan backend API dan frontend web.

---

## 2. Peran Pengguna (Roles)

| Role | Jumlah | Tanggung Jawab |
|------|--------|----------------|
| **Superadmin** | 1 | Manajemen user, konfigurasi sistem, akses penuh |
| **Admin** | 1+ | Operasional toko, laporan, manajemen produk |
| **Cashier** | 2 | Transaksi kasir toko, registrasi customer & pasien baru |
| **Doctor** | 1 | Pencatatan rekam medis, penanganan pasien, transaksi dokter |

---

## 3. Modul & Fitur

### 3.1 Autentikasi & Manajemen User

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| AUTH-01 | Login | Login dengan username & password |
| AUTH-02 | Logout | Logout dengan bersihkan session/token |
| AUTH-03 | Role-based access | Menu & aksi dibatasi sesuai role user |
| AUTH-04 | Kelola User | CRUD user oleh superadmin (nama, username, password, role, status aktif) |

### 3.2 Manajemen Customer (Pemilik Hewan)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| CUST-01 | Daftar Customer | Tabel customer dengan pencarian, sorting, pagination |
| CUST-02 | Tambah Customer | Form: nama, whatsapp, alamat (whatsapp & alamat opsional) |
| CUST-03 | Edit Customer | Ubah data customer |
| CUST-04 | Hapus Customer | Hapus customer (soft/hard delete, pertimbangkan relasi ke pets) |
| CUST-05 | Detail Customer | Lihat data customer + daftar hewan miliknya + riwayat transaksi |

### 3.3 Manajemen Pasien Hewan (Pet)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| PET-01 | Daftar Pasien | Tabel semua hewan dengan filter jenis, pemilik, pencarian |
| PET-02 | Tambah Pasien | Form: nama, jenis (kucing/anjing/dll), gender (jantan/betina), catatan, pilih pemilik |
| PET-03 | Edit Pasien | Ubah data hewan |
| PET-04 | Hapus Pasien | Hapus data hewan (dengan konfirmasi jika ada rekam medis) |
| PET-05 | Detail Pasien | Data hewan + riwayat medis lengkap + riwayat transaksi |
| PET-06 | Auto-complete Pemilik | Saat tambah pasien, input nama pemilik dengan auto-suggest dari data customer |

### 3.4 Rekam Medis (Medical History)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| MED-01 | Daftar Rekam Medis | Riwayat medis per pasien, diurutkan dari terbaru |
| MED-02 | Tambah Rekam Medis | Form: tanggal kunjungan, diagnosis, tindakan/pengobatan, catatan tambahan (hanya oleh dokter) |
| MED-03 | Edit Rekam Medis | Ubah rekam medis (hanya oleh dokter) |
| MED-04 | Hapus Rekam Medis | Hapus rekam medis (hanya oleh dokter/superadmin) |
| MED-05 | Filter Rekam Medis | Filter berdasarkan tanggal, pasien, diagnosis |

### 3.5 Manajemen Produk

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| PRD-01 | Daftar Produk | Tabel produk dengan kategori, harga, stok |
| PRD-02 | Tambah Produk | Form: kategori, kode produk, nama, berat, harga modal, harga jual, harga online, stok, satuan |
| PRD-03 | Edit Produk | Ubah data produk |
| PRD-04 | Hapus Produk | Hapus produk (non-aktifkan jika punya riwayat penjualan) |
| PRD-05 | Import Produk | Import produk dari file CSV |
| PRD-06 | Cari Produk | Pencarian cepat untuk kasir (by nama/kode) |

### 3.6 Transaksi Kasir (Sale / Toko)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| SAL-01 | Buat Transaksi | Pilih produk, atur quantity, tampilkan subtotal otomatis |
| SAL-02 | Pilih Customer | Opsional: kaitkan transaksi dengan customer/member |
| SAL-03 | Metode Pembayaran | Tunai, transfer, QRIS, dll |
| SAL-04 | Hitung Otomatis | Subtotal, diskon, pajak, total akhir, uang kembalian |
| SAL-05 | Riwayat Transaksi | Daftar transaksi dengan filter tanggal, status pembayaran |
| SAL-06 | Detail Transaksi | Lihat item, harga, pembayaran, kasir |
| SAL-07 | Nota / Struk | Cetak/tampilkan struk digital |

### 3.7 Transaksi Dokter (Vet Sale)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| VET-01 | Buat Transaksi Dokter | Pilih customer & pasien, input jasa dokter + produk, hitung otomatis |
| VET-02 | Kaitkan dengan Rekam Medis | Transaksi dokter bisa dikaitkan ke kunjungan rekam medis |
| VET-03 | Riwayat Transaksi Dokter | Daftar transaksi dokter dengan detail pasien |
| VET-04 | Integrasi Stok | Stok produk berkurang otomatis saat transaksi |

### 3.8 Dashboard

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| DSH-01 | Ringkasan Penjualan | Total penjualan hari ini, minggu ini, bulan ini |
| DSH-02 | Pasien Terbaru | Daftar pasien yang baru berkunjung |
| DSH-03 | Stok Menipis | Produk dengan stok di bawah threshold |

---

## 4. Tech Stack (Usulan)

### Backend
- **Runtime**: Node.js / TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Validasi**: Zod
- **Autentikasi**: JWT (jsonwebtoken + bcrypt)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Ant Design / shadcn/ui
- **Form**: React Hook Form + Zod resolver
- **Icons**: Lucide React
- **State**: React Context / SWR / TanStack Query

### Struktur Proyek (Monorepo)
```
vet-management-system/
├── apps/
│   ├── backend/          # Express API server
│   └── frontend/         # Next.js web app
├── packages/
│   └── shared/           # Shared types, Zod schemas, utils
├── package.json          # Root workspace
└── tsconfig.base.json    # Base TypeScript config
```

---

## 5. Model Data

### 5.1 User
```
{
  _id: ObjectId
  name: string
  username: string (unique)
  email: string
  password: string (hashed)
  role: "superadmin" | "admin" | "cashier" | "doctor"
  is_active: boolean
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.2 Customer (Pemilik)
```
{
  _id: ObjectId
  name: string
  whatsapp: string? (optional)
  address: string? (optional)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.3 Pet (Pasien Hewan)
```
{
  _id: ObjectId
  name: string
  kind: string (jenis hewan: kucing, anjing, dll)
  gender: "male" | "female"
  notes: string? (catatan alergi, dll)
  customerId: ObjectId (ref: Customer — pemilik)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.4 Medical History (Rekam Medis)
```
{
  _id: ObjectId
  petId: ObjectId (ref: Pet)
  visitDate: datetime
  diagnosis: string
  treatment: string? (tindakan/pengobatan)
  notes: string? (catatan dokter)
  doctorId: ObjectId (ref: User — role: doctor)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.5 Product
```
{
  _id: ObjectId
  category: string
  product: {
    code: string?
    name: string
    weight: number?
  }
  pricing: {
    cost: number
    selling: number
    online: number?
  }
  inventory: {
    quantity: number
  }
  unit: string? (pcs, kg, botol, dll)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.6 Sale (Transaksi Toko)
```
{
  _id: ObjectId
  receiptNumber: string (nomor struk)
  timestamp: datetime
  paymentStatus: string (lunas/hutang/dp)
  pricing: {
    cost: number
    profit: number
    total: number
    selling: number
  }
  additional: {
    serviceCharge: number
    discount: number
    tax: number
    shipping: number
  }
  summary: {
    total: number
    downPayment: number
    debt: number
  }
  paymentMethod: string
  customer: ObjectId? (ref: Customer — opsional)
  cashier: {
    userId: ObjectId (ref: User)
    name: string
  }
  items: [{
    product: { _id, name, code? }
    quantity: number
    pricing: { cost, selling, total }
  }]
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.7 Vet Sale (Transaksi Dokter)
```
{
  _id: ObjectId
  customer: { _id: ObjectId, name: string }
  cashier: { _id: ObjectId, name: string }
  pet: { _id: ObjectId, name: string, kind: string }?
  medicalHistoryId: ObjectId? (ref: MedicalHistory — opsional)
  items: [{
    product: { _id: ObjectId, name: string }
    quantity: number
    pricing: { cost, selling, total }
  }]
  summary: { total, profit, cost, paid }
  createdAt: datetime
  updatedAt: datetime
}
```

---

## 6. API Endpoint Design

### Autentikasi
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user

### Customer
- `GET /api/customers` — List customers (search, pagination, sort)
- `GET /api/customers/:id` — Detail customer + pets
- `POST /api/customers` — Create customer
- `PUT /api/customers/:id` — Update customer
- `DELETE /api/customers/:id` — Delete customer

### Pet
- `GET /api/pets` — List pets (filter by customer, search)
- `GET /api/pets/:id` — Detail pet + medical history
- `POST /api/pets` — Create pet (with auto-complete customer)
- `PUT /api/pets/:id` — Update pet
- `DELETE /api/pets/:id` — Delete pet

### Medical History
- `GET /api/pets/:petId/medical-history` — List history by pet
- `POST /api/pets/:petId/medical-history` — Add record (doctor only)
- `PUT /api/medical-history/:id` — Update record
- `DELETE /api/medical-history/:id` — Delete record

### Product
- `GET /api/products` — List products (search, filter by category, pagination)
- `GET /api/products/:id` — Detail product
- `POST /api/products` — Create product
- `PUT /api/products/:id` — Update product
- `DELETE /api/products/:id` — Delete product
- `POST /api/products/import` — Import CSV

### Sale
- `GET /api/sales` — List sales (filter date, payment method, pagination)
- `GET /api/sales/:id` — Detail sale
- `POST /api/sales` — Create sale
- `DELETE /api/sales/:id` — Delete sale (superadmin only)

### Vet Sale
- `GET /api/vet-sales` — List vet sales
- `GET /api/vet-sales/:id` — Detail
- `POST /api/vet-sales` — Create vet sale
- `DELETE /api/vet-sales/:id` — Delete

### User Management (Superadmin)
- `GET /api/users` — List users
- `POST /api/users` — Create user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user

### Dashboard
- `GET /api/dashboard/summary` — Ringkasan penjualan (hari/minggu/bulan)
- `GET /api/dashboard/recent-pets` — Pasien terbaru
- `GET /api/dashboard/low-stock` — Stok menipis

---

## 7. Prioritas Pengembangan

### Fase 1 — Core (MVP)
1. ✅ Autentikasi (login/logout, role-based)
2. ✅ Manajemen Customer (CRUD + list/search)
3. ✅ Manajemen Pet (CRUD dengan auto-complete customer)
4. ✅ Rekam Medis (CRUD, hanya dokter)
5. ✅ Produk (CRUD + list/search)
6. ✅ Transaksi Kasir (CRUD, kait ke customer opsional)
7. ✅ Dashboard sederhana

### Fase 2 — Integrasi Dokter
8. 🔄 Transaksi Dokter (kait ke customer & pet)
9. 🔄 Kaitkan transaksi dokter dengan rekam medis
10. 🔄 Dashboard dokter (pasien hari ini, riwayat kunjungan)

### Fase 3 — Enhancement
11. 📦 Import/export produk CSV
12. 📦 Laporan penjualan (harian/mingguan/bulanan)
13. 📦 Cetak struk / PDF
14. 📦 Notifikasi stok menipis
15. 📦 Multi-store / cabang

---

## 8. Catatan Teknis

| Aspek | Keputusan |
|-------|-----------|
| **Autentikasi** | JWT disimpan di HTTP-only cookie (bukan localStorage) |
| **Password** | Hash dengan bcrypt, minimal 8 karakter |
| **CORS** | Allow origin frontend (localhost:3002) |
| **Pagination** | Query-based: `?page=1&limit=10&search=...&sortBy=createdAt&order=desc` |
| **Error Response** | Format seragam: `{ success: false, message: string, errors?: any }` |
| **Success Response** | Format seragam: `{ success: true, data: T, meta?: { page, limit, total, totalPages } }` |
| **Auto-complete** | Search customer/pet dengan debounce (300ms) |
| **Stok** | Berkurang otomatis saat transaksi, tidak boleh minus |

---

## 9. Halaman Frontend

| Halaman | Route | Akses |
|---------|-------|-------|
| Login | `/login` | Semua |
| Dashboard | `/dashboard` | Semua |
| Customer List | `/dashboard/customers` | Semua |
| Customer Create | `/dashboard/customers/create` | Cashier, Admin |
| Customer Detail | `/dashboard/customers/:id` | Semua |
| Pet Detail | `/dashboard/pets/:id` | Semua |
| Medical History | `/dashboard/pets/:id/history` | Doctor |
| Product List | `/dashboard/products` | Semua |
| Product Create | `/dashboard/products/create` | Admin |
| Sale Create | `/dashboard/sales/create` | Cashier |
| Sale List | `/dashboard/sales` | Semua |
| Vet Sale Create | `/dashboard/vet-sales/create` | Doctor |
| Vet Sale List | `/dashboard/vet-sales` | Doctor |
| User Management | `/dashboard/users` | Superadmin |

---

*Dokumen ini bersifat living document — akan diperbarui seiring perkembangan proyek.*
