# 📋 Requirements — Sistem Kasir Terintegrasi Toko Hewan & Praktek Dokter Hewan

## 1. Ringkasan Proyek

Sistem kasir yang terintegrasi penuh dengan data pasien hewan, pemilik (customer/member), dan rekam medis. Digunakan oleh **2 kasir** (transaksi penjualan produk toko & jasa dokter) dan **1 dokter hewan** (pemeriksaan pasien, pencatatan rekam medis, transaksi dokter). **Jasa dokter (konsultasi, vaksinasi, grooming, dll) diperlakukan sebagai produk/barang** — sehingga sistem kasir dan stok dapat menanganinya secara seragam.

Dibangun sebagai **monorepo** dengan backend API dan frontend web.

---

## 2. Peran Pengguna (Roles)

| Role | Jumlah | Tanggung Jawab |
|------|--------|----------------|
| **Superadmin** | 1 | Manajemen user, konfigurasi sistem, akses penuh |
| **Admin** | 1+ | Operasional toko, laporan, manajemen produk & jasa |
| **Cashier** | 2 | Transaksi kasir (produk + jasa dokter), registrasi customer & pasien baru |
| **Doctor** | 1 | Pemeriksaan pasien, pencatatan rekam medis, input resep & tindakan |

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
| CUST-05 | Detail Customer | Lihat data customer + daftar hewan miliknya + riwayat transaksi & kunjungan dokter |

### 3.3 Manajemen Pasien Hewan (Pet)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| PET-01 | Daftar Pasien | Tabel semua hewan dengan filter jenis, pemilik, pencarian |
| PET-02 | Tambah Pasien | Form: nama, jenis (kucing/anjing/dll), gender (jantan/betina), catatan, pilih pemilik |
| PET-03 | Edit Pasien | Ubah data hewan |
| PET-04 | Hapus Pasien | Hapus data hewan (dengan konfirmasi jika ada rekam medis) |
| PET-05 | Detail Pasien | Data hewan + riwayat medis lengkap + riwayat transaksi (produk & jasa) |
| PET-06 | Auto-complete Pemilik | Saat tambah pasien, input nama pemilik dengan auto-suggest dari data customer |

### 3.4 Rekam Medis (Medical History) — Terintegrasi dengan Jasa & Produk

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| MED-01 | Daftar Rekam Medis | Riwayat medis per pasien, diurutkan dari terbaru |
| MED-02 | Tambah Rekam Medis | Dokter mencatat **diagnosis, tindakan, dan resep** — tindakan & resep merujuk ke **produk/jasa yang ada di sistem** |
| MED-03 | Struktur Rekam Medis | Setiap rekam medis berisi: **diagnosis**, **tindakan** (jasa dokter seperti konsultasi, vaksinasi, operasi), **resep obat** (produk toko), **catatan dokter** |
| MED-04 | Tindakan & Resep sebagai Item | Tindakan dokter dan resep obat adalah **item yang bisa masuk ke transaksi kasir** — otomatis terdaftar saat checkout |
| MED-05 | Auto-generate Transaksi | Dari rekam medis, kasir bisa langsung **generate transaksi penjualan** untuk item tindakan & obat yang dicatat dokter |
| MED-06 | Edit Rekam Medis | Ubah rekam medis (hanya oleh dokter) |
| MED-07 | Hapus Rekam Medis | Hapus rekam medis (hanya oleh dokter/superadmin) |
| MED-08 | Filter Rekam Medis | Filter berdasarkan tanggal, pasien, diagnosis, dokter |

### 3.5 Manajemen Produk & Jasa

**Produk fisik (barang) dan jasa dokter diperlakukan secara seragam dalam sistem — keduanya adalah "product" dengan tipe berbeda.**

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| PRD-01 | Daftar Produk & Jasa | Tabel semua item (produk fisik + jasa dokter) dengan filter tipe |
| PRD-02 | Tambah Produk Fisik | Form: kategori, kode, nama, berat, harga modal, harga jual, stok, satuan |
| PRD-03 | Tambah Jasa Dokter | Form: kategori="Jasa", nama jasa (Konsultasi, Vaksinasi, Grooming, Operasi, dll), harga jual, **tanpa stok** (stok = tidak terbatas / N/A) |
| PRD-04 | Edit Produk/Jasa | Ubah data produk atau jasa |
| PRD-05 | Non-aktifkan Produk/Jasa | Non-aktifkan (tidak tampil di kasir) jika sudah tidak digunakan |
| PRD-06 | Import Produk | Import produk dari file CSV |
| PRD-07 | Cari Produk/Jasa | Pencarian cepat untuk kasir & dokter (by nama/kode) — filter otomatis antara produk vs jasa sesuai konteks |

### 3.6 Transaksi Kasir (Sale) — Produk Fisik

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| SAL-01 | Buat Transaksi Toko | Pilih **produk fisik**, atur quantity, tampilkan subtotal otomatis |
| SAL-02 | Pilih Customer | Opsional: kaitkan transaksi dengan customer/member |
| SAL-03 | Metode Pembayaran | Tunai, transfer, QRIS, dll |
| SAL-04 | Hitung Otomatis | Subtotal, diskon, pajak, total akhir, uang kembalian |
| SAL-05 | Riwayat Transaksi | Daftar transaksi toko dengan filter tanggal, status pembayaran |
| SAL-06 | Detail Transaksi | Lihat item, harga, pembayaran, kasir |
| SAL-07 | Nota / Struk | Cetak/tampilkan struk digital |

### 3.7 Transaksi Dokter (Vet Sale) — Jasa + Produk Terintegrasi

**Transaksi dokter adalah transaksi kasir yang mencakup jasa dokter (tindakan) dan produk fisik (obat/resep) — semuanya dari master produk yang sama.**

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| VET-01 | Buat Transaksi Dokter | Pilih customer & pasien terkait, pilih **jasa dokter** + **produk obat** dari master produk |
| VET-02 | Checkout dari Rekam Medis | Setelah dokter selesai mencatat rekam medis (dengan tindakan & resep), kasir bisa langsung **checkout item-item tersebut** sebagai transaksi |
| VET-03 | Integrasi Stok | Stok produk fisik berkurang otomatis; jasa dokter tidak mempengaruhi stok |
| VET-04 | Riwayat Transaksi Dokter | Daftar transaksi dokter dengan detail pasien, jasa, dan obat |
| VET-05 | Kaitkan Rekam Medis | Setiap transaksi dokter bisa dikaitkan ke **ID rekam medis** — sehingga riwayat medis pasien juga mencatat biaya yang dikeluarkan |
| VET-06 | Struk Terpadu | Struk mencantumkan jasa dokter + obat + total biaya kunjungan |

### 3.8 Dashboard

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| DSH-01 | Ringkasan Penjualan | Total penjualan (produk + jasa) hari ini, minggu ini, bulan ini |
| DSH-02 | Pasien Terbaru | Daftar pasien yang baru berkunjung |
| DSH-03 | Stok Menipis | Produk fisik dengan stok di bawah threshold |
| DSH-04 | Jasa Terpopuler | Jasa dokter yang paling sering digunakan (analytics) |

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
  whatsapp: string?
  address: string?
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.3 Pet (Pasien Hewan)
```
{
  _id: ObjectId
  name: string
  kind: string (kucing, anjing, kelinci, dll)
  gender: "male" | "female"
  notes: string? (alergi, kondisi khusus, dll)
  customerId: ObjectId (ref: Customer — pemilik)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.4 Product (Barang Fisik & Jasa Dokter)

**Key concept: Product memiliki `type` — `"physical"` untuk barang toko, `"service"` untuk jasa dokter.**
**Jasa dokter (konsultasi, vaksinasi, grooming, operasi, dll) dicatat sebagai produk dengan type="service", stok = N/A.**

```
{
  _id: ObjectId
  type: "physical" | "service"     ← membedakan barang vs jasa
  category: string                  (contoh: "Makanan", "Obat", "Jasa", "Aksesoris")
  product: {
    code: string?                   (khusus barang fisik — opsional)
    name: string
    weight: number?                 (khusus barang fisik — opsional)
  }
  pricing: {
    cost: number?                   (khusus barang fisik — harga modal)
    selling: number                 (harga jual — berlaku untuk barang & jasa)
    online: number?                 (khusus barang fisik — opsional)
  }
  inventory: {
    quantity: number?               (null/undefined untuk jasa — stok tidak terbatas)
  }
  unit: string?                     (pcs, kg, botol — untuk barang; "-" untuk jasa)
  is_active: boolean                (soft delete / non-aktif)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.5 Medical History (Rekam Medis) — Terintegrasi dengan Produk & Jasa

**Rekam medis mencatat diagnosis + daftar tindakan (jasa) + daftar resep (obat) yang semuanya merujuk ke master Product.**

```
{
  _id: ObjectId
  petId: ObjectId (ref: Pet)
  visitDate: datetime
  diagnosis: string                  (diagnosis dokter)
  doctorId: ObjectId (ref: User — role: doctor)

  // Daftar tindakan/jasa yang diberikan (referensi ke Product type="service")
  treatments: [{
    productId: ObjectId (ref: Product — type="service")
    name: string                     (snapshot nama jasa)
    price: number                    (snapshot harga jasa)
    notes: string?                   (catatan khusus tindakan)
  }]

  // Daftar obat/resep yang diberikan (referensi ke Product type="physical")
  prescriptions: [{
    productId: ObjectId (ref: Product — type="physical")
    name: string                     (snapshot nama obat)
    quantity: number
    price: number                    (snapshot harga satuan)
    dosage: string?                  (aturan pakai: 3x1 sehari, dll)
    notes: string?                   (catatan resep)
  }]

  notes: string?                     (catatan tambahan dokter)
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.6 Sale (Transaksi Toko — Produk Fisik Saja)

```
{
  _id: ObjectId
  receiptNumber: string
  timestamp: datetime
  paymentStatus: "paid" | "debt" | "dp"
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
  customer: ObjectId? (ref: Customer)
  cashier: {
    userId: ObjectId (ref: User)
    name: string
  }
  items: [{
    product: { _id: ObjectId, name: string, code: string? }
    quantity: number
    pricing: { cost, selling, total }
  }]
  createdAt: datetime
  updatedAt: datetime
}
```

### 5.7 Vet Sale (Transaksi Dokter — Jasa + Produk Terpadu)

**Transaksi dokter mencakup jasa dokter (tindakan) dan produk fisik (obat) — item dari master Product.**
**Bisa dikaitkan ke rekam medis tertentu untuk traceability lengkap.**

```
{
  _id: ObjectId
  receiptNumber: string
  timestamp: datetime
  customer: {
    _id: ObjectId (ref: Customer)
    name: string
  }
  pet: {
    _id: ObjectId (ref: Pet)
    name: string
    kind: string
  }?
  medicalHistoryId: ObjectId? (ref: MedicalHistory — kait ke rekam medis)
  cashier: {
    _id: ObjectId (ref: User)
    name: string
  }
  items: [{
    product: {
      _id: ObjectId (ref: Product)
      name: string
      type: "physical" | "service"     ← membedakan obat vs jasa di struk
    }
    quantity: number
    pricing: {
      cost: number?                     (null untuk jasa)
      selling: number
      total: number
    }
    dosage: string?                     (aturan pakai — khusus obat)
  }]
  summary: {
    total: number
    profit: number
    cost: number
    paid: number
  }
  paymentStatus: "paid" | "debt" | "dp"
  paymentMethod: string
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
- `GET /api/pets/:petId/medical-history` — List history by pet (with treatments & prescriptions)
- `GET /api/medical-history/:id` — Detail rekam medis (diagnosis, tindakan, resep lengkap)
- `POST /api/pets/:petId/medical-history` — Add record (doctor only) — includes treatments[] & prescriptions[]
- `PUT /api/medical-history/:id` — Update record
- `DELETE /api/medical-history/:id` — Delete record

### Product (Barang Fisik & Jasa Dokter)
- `GET /api/products` — List products (filter by type, category, search, pagination)
- `GET /api/products/services` — Khusus jasa dokter (type="service")
- `GET /api/products/physical` — Khusus barang fisik (type="physical")
- `GET /api/products/:id` — Detail product
- `POST /api/products` — Create product (dengan field type)
- `PUT /api/products/:id` — Update product
- `DELETE /api/products/:id` — Non-aktifkan product
- `POST /api/products/import` — Import CSV (khusus barang fisik)

### Sale (Transaksi Toko — Produk Fisik)
- `GET /api/sales` — List sales (filter date, payment method, pagination)
- `GET /api/sales/:id` — Detail sale
- `POST /api/sales` — Create sale
- `DELETE /api/sales/:id` — Delete sale (superadmin only)

### Vet Sale (Transaksi Dokter — Jasa + Produk)
- `GET /api/vet-sales` — List vet sales (filter by pet, customer, date)
- `GET /api/vet-sales/:id` — Detail vet sale
- `POST /api/vet-sales` — Create vet sale (dari item tindakan & resep)
- `POST /api/vet-sales/from-medical-history/:medicalHistoryId` — Generate transaksi dari rekam medis
- `DELETE /api/vet-sales/:id` — Delete

### User Management (Superadmin)
- `GET /api/users` — List users
- `POST /api/users` — Create user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user

### Dashboard
- `GET /api/dashboard/summary` — Ringkasan penjualan (produk + jasa — hari/minggu/bulan)
- `GET /api/dashboard/recent-pets` — Pasien terbaru
- `GET /api/dashboard/low-stock` — Stok menipis (khusus barang fisik)
- `GET /api/dashboard/top-services` — Jasa dokter terpopuler

---

## 7. Alur Bisnis Utama

### 7.1 Alur Kunjungan Pasien (Lengkap)
```
1. Customer datang dengan hewan peliharaan
2. Kasir mencari / mendaftarkan customer & pasien
3. Dokter memeriksa pasien
4. Dokter mencatat rekam medis → diagnosis + tindakan (jasa) + resep (obat)
5. Kasir membuka transaksi dari rekam medis tersebut
   → Item tindakan & resep otomatis masuk ke keranjang
6. Kasir menambahkan produk toko lain jika perlu (makanan, aksesoris, dll)
7. Kasir memproses pembayaran
8. Struk diberikan ke customer
```

### 7.2 Alur Jasa Dokter sebagai Produk
```
1. Admin/User menambah jasa dokter ke master produk
   → type: "service", category: "Jasa", name: "Konsultasi", price: 50000
2. Produk jasa muncul di daftar produk dengan icon/tag "Jasa"
3. Dokter memilih jasa dari daftar saat mencatat rekam medis
4. Kasir melihat jasa sebagai item transaksi (sama seperti barang)
5. Stok tidak terpengaruh (jasa tidak punya stok)
6. Laporan penjualan bisa memfilter: pendapatan dari produk vs jasa
```

---

## 8. Prioritas Pengembangan

### Fase 1 — Core (MVP)
| # | Modul | Catatan |
|---|-------|---------|
| 1 | Autentikasi | Login/logout, role-based routing |
| 2 | Manajemen Customer | CRUD + list/search |
| 3 | Manajemen Pet | CRUD dengan auto-complete customer |
| 4 | Produk (Barang + Jasa) | CRUD, type field, filter type |
| 5 | Transaksi Toko (Sale) | Produk fisik saja, kait ke customer opsional |
| 6 | Dashboard awal | Ringkasan penjualan, stok menipis |

### Fase 2 — Integrasi Dokter
| # | Modul | Catatan |
|---|-------|---------|
| 7 | Rekam Medis | CRUD oleh dokter, dengan treatments[] & prescriptions[] |
| 8 | Transaksi Dokter (Vet Sale) | Jasa + produk terpadu |
| 9 | Generate Transaksi dari Rekam Medis | Kasir checkout item rekam medis |
| 10 | Dashboard Dokter | Pasien hari ini, riwayat kunjungan |

### Fase 3 — Enhancement
| # | Fitur | Catatan |
|---|-------|---------|
| 11 | Import/export produk CSV | Khusus barang fisik |
| 12 | Laporan penjualan & jasa | Harian/mingguan/bulanan, breakdown produk vs jasa |
| 13 | Cetak struk / PDF | Struk terpadu untuk toko & dokter |
| 14 | Notifikasi stok menipis | Khusus barang fisik |
| 15 | Multi-store / cabang | — |

---

## 9. Catatan Teknis

| Aspek | Keputusan |
|-------|-----------|
| **Autentikasi** | JWT disimpan di HTTP-only cookie (bukan localStorage) |
| **Password** | Hash dengan bcrypt, minimal 8 karakter |
| **CORS** | Allow origin frontend (default: localhost:3002) |
| **Pagination** | Query-based: `?page=1&limit=10&search=...&sortBy=createdAt&order=desc` |
| **Error Response** | Format seragam: `{ success: false, message: string, errors?: any }` |
| **Success Response** | Format seragam: `{ success: true, data: T, meta?: { page, limit, total, totalPages } }` |
| **Auto-complete** | Search customer/pet dengan debounce (300ms) |
| **Stok barang fisik** | Berkurang otomatis saat transaksi, tidak boleh minus |
| **Stok jasa dokter** | Tidak ada stok (inventory.quantity = null) — tidak terpengaruh transaksi |
| **Soft delete produk** | Product di-non-aktifkan (is_active=false), bukan dihapus — agar data historis tetap utuh |
| **Snapshot harga** | Harga jasa & obat di-snapshot ke rekam medis & transaksi saat checkout (antisipasi perubahan harga di masa depan) |

---

## 10. Halaman Frontend

| Halaman | Route | Akses |
|---------|-------|-------|
| Login | `/login` | Semua |
| Dashboard | `/dashboard` | Semua |
| Customer List | `/dashboard/customers` | Semua |
| Customer Create | `/dashboard/customers/create` | Cashier, Admin |
| Customer Detail | `/dashboard/customers/:id` | Semua |
| Pet Detail | `/dashboard/pets/:id` | Semua |
| Medical History | `/dashboard/pets/:id/history` | Doctor |
| Medical History Create | `/dashboard/pets/:id/history/create` | Doctor |
| Product List | `/dashboard/products` | Semua |
| Product Create | `/dashboard/products/create` | Admin |
| Sale Create | `/dashboard/sales/create` | Cashier |
| Sale List | `/dashboard/sales` | Semua |
| Vet Sale Create | `/dashboard/vet-sales/create` | Doctor, Cashier |
| Vet Sale List | `/dashboard/vet-sales` | Dokter, Cashier |
| User Management | `/dashboard/users` | Superadmin |

---

## 11. Glossary

| Istilah | Definisi |
|---------|----------|
| **Produk Fisik** | Barang toko yang punya stok (makanan, obat, aksesoris, dll) |
| **Jasa Dokter** | Layanan dokter hewan (konsultasi, vaksinasi, grooming, operasi) — diperlakukan sebagai produk type="service" |
| **Rekam Medis** | Catatan kunjungan dokter: diagnosis + tindakan (jasa) + resep (obat) |
| **Sale** | Transaksi penjualan produk fisik di toko |
| **Vet Sale** | Transaksi penjualan jasa dokter + obat (bisa dari rekam medis) |
| **Treatments** | Daftar tindakan/jasa yang diberikan dalam satu kunjungan |
| **Prescriptions** | Daftar obat/resep yang diberikan dalam satu kunjungan |

---

*Dokumen ini bersifat living document — akan diperbarui seiring perkembangan proyek.*
