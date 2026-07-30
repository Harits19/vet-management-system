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

### 8. Transaksi Penjualan — Handle MongoDB Replica Set Error
Refactor `createSale()` di `sale.service.ts` untuk tidak menggunakan session/transaction, sama seperti `createVetSale()`. Operasi penjualan sekarang langsung sequential tanpa `startSession()`.

---

## 🔜 Belum Dikerjakan

### 9. Gabung Sale + VetSale Jadi Satu Collection `Transaction`

**Permasalahan:** Saat ini Sale (transaksi toko) dan VetSale (transaksi dokter) adalah dua collection terpisah dengan struktur hampir identik. Ini menyebabkan:
- Dashboard & laporan perlu query 2 collection
- Riwayat customer terpecah
- Duplikasi kode (service, controller, route, frontend)
- Struk tidak unified

**Solusi:** Gabung jadi satu collection `Transaction` dengan field `type: "shop" | "vet"`.

**Struktur usulan:**
```ts
{
  _id: ObjectId,
  type: "shop" | "vet",
  receiptNumber: string,
  timestamp: Date,
  customer: { _id, name },
  pet?: { _id, name, kind },           // vet-only
  medicalHistoryId?: ObjectId,          // vet-only
  cashier: { _id, name },
  items: [{
    product: { _id, name, type: "physical" | "service" },
    quantity: number,
    pricing: { cost?, selling, total },
    dosage?: string                     // prescription-only
  }],
  summary: { total, profit, cost, paid },
  paymentStatus: "paid" | "debt" | "dp",
  paymentMethod: string,
  createdAt, updatedAt
}
```

**Yang perlu diubah:**
| Lapisan | Perubahan |
|---------|-----------|
| Shared types | Hapus `sale.ts`, `vet-sale.ts`. Buat `transaction.ts` |
| Backend model | Hapus `sale.model.ts`, `vet-sale.model.ts`. Buat `transaction.model.ts` |
| Backend service | Gabung `sale.service.ts` + `vet-sale.service.ts` jadi `transaction.service.ts` |
| Backend controller | Gabung → `transaction.controller.ts` |
| Backend routes | 1 route `/api/transactions` dengan filter `?type=shop|vet` |
| Frontend | 2 halaman tetap (Penjualan & Transaksi Dokter) tapi 1 API calls |
