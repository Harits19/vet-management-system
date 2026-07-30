# Enhancement & Bug Fix

## ✅ Selesai

### 1. Tambah Pasien — Pemilik Tidak Ditemukan
Select pemilik di halaman tambah pasien menampilkan tombol **"Tambah Pemilik Baru"** saat hasil search kosong.

### 2. Error Handling — Ant Design Static message
Semua `message.error/success/warning` static diganti `useAntdMessage()` hook via `App.useApp()`. Root dibungkus `<App>` di `providers.tsx`.

### 3. Transaksi Dokter — Tambah Pasien Baru dari Select
Select pasien di Transaksi Dokter Baru menampilkan **"Tambah Pasien Baru"** jika belum ada pasien.

### 4. Routing — Redirect Base URL & Login Session
- `/` → `/login`, `/login` → `/dashboard` (jika sudah login), `/dashboard` → `/login` (jika belum)

### 5. Disable Pilih Pasien Sebelum Customer Dipilih
Select pasien di halaman Transaksi Dokter Baru di-*disable* selama customer belum dipilih.

### 6. Informasi Kembalian
Tampilkan **kembalian** di Penjualan & Transaksi Dokter saat bayar > total.

### 7. Alias Customer → Customer/Pemilik
Ganti "Customer" → **"Pemilik"** di sidebar & judul halaman.

### 8. Transaksi Penjualan — Handle MongoDB Replica Set Error
Refactor `createSale()` tanpa session/transaction.

### 9. Gabung Sale + VetSale Jadi Satu Collection `Transaction`
Sale + VetSale merged ke 1 collection `Transaction` dengan field `type: "shop" | "vet"`. Satu endpoint `/api/transactions` dengan filter `?type=shop|vet`. Backend code berkurang signifikan.

## 🔜 Belum Dikerjakan

—
