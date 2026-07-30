# Enhancement & Bug Fix

## ✅ Selesai

### 1. Tambah Pasien — Pemilik Tidak Ditemukan

**Masalah:** Saat user menambah pasien hewan, jika pemilik (customer) tidak ada di hasil search atau data kosong, tidak ada aksi untuk membuat pemilik baru.

**Solusi:** Select pemilik di halaman tambah pasien sekarang menampilkan tombol **"Tambah Pemilik Baru"** via `notFoundContent` pada antd Select. Mengarahkan ke halaman `/dashboard/customers` dan menutup modal tambah pasien.

**File diubah:** `app/dashboard/pets/page.tsx`

---

### 2. Error Handling — Ant Design Static message

**Masalah:** Warning `Static function can not consume context like dynamic theme. Please use 'App' component instead.` muncul saat menggunakan `message.error/success/warning` static dari antd.

**Solusi:**
- Root layout dibungkus `<App>` dari antd di `providers.tsx`
- Dibuat hook `useAntdMessage()` via `App.useApp()`
- Semua halaman diubah dari `message.error(...)` → `msg.error(...)` dengan `const msg = useAntdMessage()`

**File diubah:** `providers.tsx`, `hooks/useAntdMessage.ts`, semua page yang menggunakan `message`

---

### 3. Transaksi Dokter — Tambah Pasien Baru dari Select

**Masalah:** Di halaman Transaksi Dokter Baru, select pasien hanya menampilkan daftar pasien yang sudah ada. Tidak ada opsi untuk menambah pasien baru jika pasien belum terdaftar.

**Solusi:** Select pasien menampilkan tombol **"Tambah Pasien Baru"** via `notFoundContent` saat hasil kosong, mengarahkan ke `/dashboard/pets`.

**File diubah:** `app/dashboard/vet-sales/create/page.tsx`

---

### 4. Routing — Redirect Base URL & Login Session

**Masalah:**
- Halaman `/` (base) hanya menampilkan null
- Halaman `/login` tidak mengecek apakah user sudah login

**Solusi:**
- `/` → redirect ke `/login` via `router.replace("/login")` di `useEffect`
- `/login` → cek session via `useAuth()`, jika `user` ada → `router.replace("/dashboard")`
- `/dashboard` → sudah ada pengecekan otomatis di layout (tidak ada sesi → redirect `/login`)

**File diubah:** `app/page.tsx`, `app/login/page.tsx`

---

### 5. Disable Pilih Pasien Sebelum Customer Dipilih

**Masalah:** Select pasien di halaman Transaksi Dokter Baru aktif meskipun customer belum dipilih. User bisa memilih pasien tanpa customer, yang menyebabkan data transaksi tidak konsisten.

**Solusi:** Select pasien di-*disable* (`disabled={!selectedCustomer}`) selama `selectedCustomer` kosong. Nilai `selectedCustomer` di-update via `onChange` di select customer.

**File diubah:** `app/dashboard/vet-sales/create/page.tsx`

---

### 6. Informasi Kembalian

**Masalah:** Saat kasir memasukkan jumlah bayar yang melebihi total belanja, tidak ada informasi kembalian yang ditampilkan.

**Solusi:** Tambahkan perhitungan `kembalian = paidAmount - cartTotal` (jika `paidAmount > cartTotal`) dan tampilkan dengan warna hijau (`#52c41a`). Diterapkan di:
- Modal **Transaksi Baru** (Penjualan) — menggunakan `Form.useWatch("paidAmount")` agar reaktif
- Halaman **Transaksi Dokter Baru** — menggunakan state `paidAmount`
- Detail Transaksi Dokter — menampilkan kembalian jika `summary.paid > summary.total`

**File diubah:** `app/dashboard/sales/page.tsx`, `app/dashboard/vet-sales/create/page.tsx`, `app/dashboard/vet-sales/[id]/page.tsx`

---

### 7. Alias Customer → Customer/Pemilik

**Masalah:** Istilah "Customer" kurang familier untuk user toko hewan yang lebih sering menyebut "Pemilik".

**Solusi:** Ganti label di sidebar menu dan judul halaman:
- Sidebar: `Customer` → `Customer/Pemilik`
- Judul halaman daftar: `Customer` → `Customer/Pemilik`
- Judul halaman detail: `Detail Customer` → `Detail Customer/Pemilik`

**File diubah:** `app/dashboard/layout.tsx`, `app/dashboard/customers/page.tsx`, `app/dashboard/customers/[id]/page.tsx`

---

### 8. Transaksi Penjualan — Handle MongoDB Replica Set Error

**Masalah:** Error `Transaction numbers are only allowed on a replica set member or mongos` saat membuat transaksi baru di Penjualan (Sale). Penyebab: fungsi `createSale()` menggunakan `mongoose.startSession()` + `startTransaction()` yang hanya berjalan di MongoDB replica set.

**Solusi:** Refactor `createSale()` untuk tidak menggunakan session/transaction, sama seperti `createVetSale()`. Operasi berjalan sequential tanpa `startSession()`.

**File diubah:** `apps/backend/src/services/sale.service.ts`

---

### 9. Gabung Sale + VetSale Jadi Satu Collection `Transaction`

**Masalah:** Sale (transaksi toko) dan VetSale (transaksi dokter) adalah dua collection terpisah dengan struktur hampir identik, menyebabkan:
- Dashboard & laporan perlu query 2 collection
- Riwayat customer terpecah
- Duplikasi kode (service, controller, route, frontend)
- Struk tidak unified

**Solusi:** Gabung jadi satu collection `Transaction` dengan field `type: "shop" | "vet"`. Perubahan:

| Layer | Sebelum | Sesudah |
|-------|---------|---------|
| Shared types | `sale.ts` + `vet-sale.ts` | `transaction.ts` |
| Backend model | `sale.model.ts` + `vet-sale.model.ts` | `transaction.model.ts` |
| Backend service | `sale.service.ts` + `vet-sale.service.ts` | `transaction.service.ts` |
| Backend controller | `sale.controller.ts` + `vet-sale.controller.ts` | `transaction.controller.ts` |
| Backend routes | `/api/sales` + `/api/vet-sales` | `/api/transactions` |
| Frontend API | `/api/sales` + `/api/vet-sales` | `/api/transactions?type=shop\|vet` |

**Model Transaction:**
```ts
{
  _id: ObjectId,
  type: "shop" | "vet",
  receiptNumber: string,
  timestamp: Date,
  customer?: { _id, name },              // shop: bisa null (guest)
  pet?: { _id, name, kind },             // vet-only
  medicalHistoryId?: ObjectId,           // vet-only
  cashier: { _id, name },
  items: [{
    product: { _id, name, type, code? },
    quantity: number,
    pricing: { cost?, selling, total },
    dosage?: string                      // prescription-only
  }],
  summary: { total, profit, cost, paid },
  paymentStatus: "paid" | "debt" | "dp",
  paymentMethod: string,
  createdAt, updatedAt
}
```

**File baru:** `packages/shared/src/transaction.ts`, `apps/backend/src/models/transaction.model.ts`, `apps/backend/src/services/transaction.service.ts`, `apps/backend/src/controllers/transaction.controller.ts`, `apps/backend/src/routes/transaction.route.ts`
**File dihapus:** `sale.model.ts`, `vet-sale.model.ts`, `sale.service.ts`, `vet-sale.service.ts`, `sale.controller.ts`, `vet-sale.controller.ts`, `sale.route.ts`, `vet-sale.route.ts`

---

### 10. Unified Halaman Transaksi (Gabung Penjualan & Transaksi Dokter)

**Masalah:** Sidebar punya 2 menu terpisah (Penjualan & Transaksi Dokter) dengan 2 halaman frontend berbeda, padahal backend sudah 1 collection `Transaction`. Kasir dan dokter harus navigasi ke menu berbeda untuk hal yang sama.

**Solusi:** Gabung jadi 1 halaman `/dashboard/transactions` dengan tab filter.

**Sidebar baru (6 menu):**
```
📊 Dashboard
👥 Pemilik
🐾 Pasien
📦 Produk & Jasa
🛒 Transaksi
📋 Rekam Medis              (doctor/admin/superadmin only)
```

**Halaman Transaksi** `/dashboard/transactions`:
| Tab | Filter API | Default untuk | Kolom tambahan |
|-----|-----------|---------------|----------------|
| Semua | tanpa filter | Semua | Tipe, Pasien |
| Barang | `?type=shop` | Semua (cashier default) | — |
| Dokter | `?type=vet` | Semua (doctor default) | Pasien |

**Fitur:**
- Tab role-aware: cashier default ke "Barang", doctor default ke "Dokter"
- 1 tombol **"Transaksi Baru"** dengan dropdown: "Transaksi Barang" → `/dashboard/sales` | "Konsultasi Dokter" → `/dashboard/vet-sales/create`
- Modal detail transaksi unified — tampilkan semua field termasuk kembalian
- Menu aktif otomatis `isActive()` — pathname yang diawali prefix akan terhighlight

**File baru:** `app/dashboard/transactions/page.tsx`
**File diubah:** `app/dashboard/layout.tsx`
**File lama tidak dihapus:** `/dashboard/sales` dan `/dashboard/vet-sales/*` masih bisa diakses via direct URL



## Belum Dikerjakan

### 11. Fix issue 
```
## Error Type
Console Error

## Error Message
Warning: [antd: Modal] Static function can not consume context like dynamic theme. Please use 'App' component instead.


    at Object.onClick (app\dashboard\transactions\page.tsx:114:19)
    at button (<anonymous>:null:null)
    at render (app\dashboard\transactions\page.tsx:113:11)
    at TransactionsPage (app\dashboard\transactions\page.tsx:156:9)

## Code Frame
  112 |           <Button size="small" icon={<Eye size={14} />} onClick={() => setDetail(r)} />
  113 |           <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => {
> 114 |             Modal.confirm({
      |                   ^
  115 |               title: "Hapus transaksi?",
  116 |               onOk: async () => { await apiFetch(`/api/transactions/${r._id}`, { method: "DELETE" }); msg.success("Dihapus"); fetchData(); },
  117 |             });

Next.js version: 15.5.22 (Webpack)
```


### 12. Ganti modal transaksi barang menjadi halaman tersendiri seperti konsultasi dokter, dan sesuaikan tombol dropdown 

### 13. Saya tidak menemukan cara dokter menambah rekam medis

###

