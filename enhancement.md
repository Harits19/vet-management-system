# Enhancement & Bug Fix

## ✅ Selesai

### 1. Tambah Pasien — Pemilik Tidak Ditemukan
Select pemilik di halaman tambah pasien sekarang menampilkan tombol **"Tambah Pemilik Baru"** saat hasil search kosong maupun data kosong sejak awal, mengarahkan ke halaman customer.

### 2. Error Handling — Ant Design Static message
Semua pemanggilan `message.error/success/warning` static dari antd diganti dengan `useAntdMessage()` hook via `App.useApp()`. Root layout sudah dibungkus `<App>` di `providers.tsx`.

### 3. Transaksi Dokter — Tambah Pasien Baru dari Select
Select pasien di halaman Transaksi Dokter Baru menampilkan tombol **"Tambah Pasien Baru"** jika belum ada pasien terdaftar untuk customer tersebut.

### 4. Routing — Redirect Base URL & Login Session
- `/` → redirect ke `/login`
- `/login` → jika sudah login, redirect ke `/dashboard`
- `/dashboard` → jika tidak ada sesi, redirect ke `/login`

### 5. Disable Pilih Pasien Sebelum Customer Dipilih
Di halaman **Transaksi Dokter Baru**, select pasien (pet) di-*disable* selama customer belum dipilih.

### 6. Informasi Kembalian
Di halaman **Penjualan** dan **Transaksi Dokter**, tampilkan informasi **kembalian** saat jumlah dibayar melebihi total belanja.

### 7. Alias Customer → Customer/Pemilik
Ganti istilah "Customer" menjadi **"Customer/Pemilik"** di sidebar menu dan judul halaman agar lebih mudah dipahami user.

---

## 🔜 Belum Dikerjakan

### 8. Transaksi Penjualan — Handle MongoDB Replica Set Error
**Issue:** `Transaction numbers are only allowed on a replica set member or mongos` saat membuat transaksi baru di Penjualan (Sale).

**Lokasi:** `apps/backend/src/services/sale.service.ts` — fungsi `createSale()` menggunakan `mongoose.startSession()` + `startTransaction()`.

**Penyebab:** Fungsi `createSale` masih menggunakan session + transaction. Sementara di `vet-sale.service.ts` sudah di-refactor tanpa transaction.

**Solusi:** Refactor `createSale()` di `sale.service.ts` untuk tidak menggunakan session/transaction, sama seperti `createVetSale()`.
