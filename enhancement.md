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


### 11. Fix Modal Static Function Context Warning

**Masalah:** Warning `Static function can not consume context like dynamic theme` muncul saat menggunakan `Modal.confirm()` di halaman `/dashboard/transactions`. `Modal.confirm()` adalah static method yang tidak terhubung ke `App` context.

**Lokasi:** `app/dashboard/transactions/page.tsx:114`

**Solusi:** Buat wrapper hook `useAntdModal()` via `App.useApp()` — pola yang sama seperti `useAntdMessage()`. Atau gunakan `modal.confirm()` dari `App.useApp()` sebagai pengganti `Modal.confirm()`.

**Contoh:**
```tsx
// hooks/useAntdModal.ts
import { App } from "antd";
export function useAntdModal() {
  const { modal } = App.useApp();
  return modal;
}
```

```tsx
// di komponen
const modal = useAntdModal();
modal.confirm({ title: "...", onOk: ... });
```

**File diubah:** `app/dashboard/transactions/page.tsx`, (opsional) `hooks/useAntdModal.ts`

---

### 12. Modal Tambah Transaksi Barang Jadi Halaman Tersendiri

**Masalah:** Form tambah transaksi barang saat ini berupa Modal di halaman `/dashboard/sales`. Modal jadi terlalu panjang dengan cart, produk select, dan form payment. Juga tidak konsisten dengan Transaksi Dokter yang punya halaman terpisah (`/dashboard/vet-sales/create`).

**Solusi:** Buat halaman `/dashboard/transactions/create-shop` dengan layout yang sama seperti `/dashboard/vet-sales/create`. Sesuaikan tombol dropdown "Transaksi Baru" di halaman `/dashboard/transactions`:
- "Transaksi Barang" → `/dashboard/transactions/create-shop`
- "Konsultasi Dokter" → `/dashboard/vet-sales/create`

**File baru:** `app/dashboard/transactions/create-shop/page.tsx`
**File diubah:** `app/dashboard/transactions/page.tsx` (update dropdown path)

---

### 13. Flow Konsultasi Dokter — Tampilkan Riwayat Rekam Medis Saat Pasien Dipilih

**Masalah:** Saat dokter membuat transaksi di halaman `/dashboard/vet-sales/create`, setelah memilih pasien tidak ada informasi riwayat rekam medis pasien tersebut. Dokter harus buka tab lain untuk lihat riwayat.

**Solusi:** Setelah pasien dipilih, tampilkan panel **Riwayat Rekam Medis** pasien tersebut langsung di halaman yang sama. Panel berisi:
- Tabel ringkas riwayat (tanggal kunjungan, diagnosis, jml tindakan, jml resep)
- Tombol **"Tambah Rekam Medis"** yang membuka modal create rekam medis (sama seperti di halaman detail pasien)
- Setelah rekam medis dibuat, otomatis kaitkan `medicalHistoryId` ke transaksi yang sedang dibuat

**File diubah:** `app/dashboard/vet-sales/create/page.tsx`

---

### 14. Hapus Semua Code / File / Folder yang Tidak Digunakan

**Masalah:** Setelah refactor backend dan frontend, beberapa file lama masih ada:
- File shared types lama (`sale.ts`, `vet-sale.ts`) — sudah tidak di-export dari index.ts tapi file fisik masih ada
- File frontend lama (`/dashboard/sales/page.tsx`, `/dashboard/vet-sales/page.tsx`, dll) — masih bisa diakses via direct URL meskipun sidebar sudah tidak nge-link
- File backend lama — sudah dihapus saat item #9

**Solusi:** Audit dan hapus:
1. `packages/shared/src/sale.ts`
2. `packages/shared/src/vet-sale.ts`
3. `app/dashboard/sales/page.tsx` — fungsinya sudah digantikan `/dashboard/transactions`
4. `app/dashboard/vet-sales/page.tsx` — fungsinya sudah digantikan `/dashboard/transactions`
5. `app/dashboard/vet-sales/[id]/page.tsx` — bisa redirect ke `/dashboard/transactions/[id]`
6. `app/dashboard/vet-sales/create/page.tsx` — masih dipake oleh dropdown Transaksi Dokter

**Catatan:** Hapus hati-hati — pastikan tidak ada import atau referensi yang masih pointing ke file tersebut sebelum dihapus.




### 15. Hapus Tindakan (Jasa) & Resep Obat dari Form Tambah Rekam Medis

**Masalah:** Form tambah rekam medis (di halaman detail pasien & halaman konsultasi dokter) memiliki field terpisah untuk **Tindakan (Jasa)** dan **Resep Obat** yang harus diisi manual oleh dokter. Padahal item-item tersebut sudah ada di keranjang transaksi. Dokter harus input 2x — sekali di keranjang, sekali di rekam medis.

**Solusi:**
1. Hapus field **Tindakan (Jasa)** dan **Resep Obat** dari form tambah rekam medis
2. Form rekam medis cukup: **Tanggal Kunjungan, Diagnosis, Catatan Dokter**
3. Rekam medis dibuat **setelah** tombol "Proses Pembayaran" ditekan, dengan data tindakan & resep diambil dari item transaksi yang sudah dipilih
4. Di backend, `createVetTransaction` otomatis membuat rekam medis jika ada `petId` dan item transaksi mengandung service/physical products

**Alur baru:**
```
1. Dokter pilih customer & pasien
2. Dokter tambah jasa & obat ke keranjang
3. Dokter isi diagnosis singkat + catatan
4. Klik "Proses Pembayaran"
5. Backend: create transaction + create medical history (ambil treatments/prescriptions dari items)
6. medicalHistoryId otomatis terisi di transaksi
```

**File diubah:**
- `app/dashboard/vet-sales/create/page.tsx` — sederhanakan form rekam medis, pindah logika ke submit
- `app/dashboard/pets/[id]/page.tsx` — sederhanakan modal rekam medis
- `apps/backend/src/services/transaction.service.ts` — auto-create medical history saat transaksi vet

### 16. Lihat Riwayat Medis di Detail Pasien

**Fungsi:** Halaman `/dashboard/pets/[id]` menampilkan kartu **Riwayat Medis** yang berisi tabel riwayat rekam medis pasien tersebut.

**Backend:** `GET /api/medical-histories/by-pet/:petId` — mengembalikan records terbaru (limit 5) + total kunjungan.

**Frontend:** Kartu Riwayat Medis di halaman detail pasien dengan kolom Tanggal, Diagnosis, Dokter, Aksi. Tombol **"Konsultasi Baru"** mengarahkan ke `/dashboard/vet-sales/create?customerId=X&petId=Y` dengan form pre-filled.

**Status:** ✅ Selesai (sudah diimplementasikan sejak item #13 & #15)


### 17. Diagnosis Menggunakan Dropdown + Auto-fill Item

**Masalah:** Diagnosis saat ini berupa input text bebas. Tidak ada daftar diagnosis standar, tidak ada pilihan cepat, dan dokter harus memilih item (obat/jasa/barang) satu per satu setelah mengisi diagnosis.

**Solusi:**
- Diagnosis berupa **dropdown** (autocomplete): pilih dari daftar diagnosis yang sudah ada, atau ketik input baru jika diagnosis tersebut belum pernah dipakai
- Ketika diagnosis dipilih → otomatis muncul input untuk **Obat, Jasa, dan Barang** 
- **Konsultasi dokter bisa gratis** — transaksi bisa dibuat tanpa item, hanya diagnosis (total Rp 0)

**File diubah:**
- `packages/shared/src/medical-history.ts` — schema diagnosis
- `apps/backend/src/services/transaction.service.ts` — izinkan items kosong untuk vet
- `apps/frontend/app/dashboard/vet-sales/create/page.tsx` — dropdown diagnosis + auto-fill

---

### 18. Tambah Field di Rekam Medis (SOAP)

**Masalah:** Rekam medis saat ini hanya punya Diagnosis & Catatan. Tidak ada struktur pemeriksaan klinis standar.

**Solusi:** Tambah field SOAP di rekam medis:
| Field | Label | Tipe |
|-------|-------|------|
| `O` | **Hasil Pemeriksaan Laboratorium** | Text area |
| `A` | **Pemeriksaan Fisik** | Text area |
| `P` | **Catatan Dokter Untuk Pemilik** | Text area |
| `P` | **Catatan Dokter Untuk Paramedis** | Text area |

**File diubah:**
- `packages/shared/src/medical-history.ts` — tambah field baru
- `apps/backend/src/models/medical-history.model.ts` — tambah field schema
- `apps/frontend/app/dashboard/vet-sales/create/page.tsx` — form tambah field
- `apps/frontend/app/dashboard/medical-histories/[id]/page.tsx` — tampilkan field baru
- `apps/frontend/app/dashboard/pets/[id]/page.tsx` — modal rekam medis

---

### 19. Tambah Pasien — Urutan Field Baru (Signalment)

**Masalah:** Form tambah pasien saat ini berurutan campur aduk (nama, jenis, gender, catatan) tanpa pengelompokan logis.

**Solusi:** Urutkan ulang form tambah pasien menjadi 2 bagian:

**Data Pasien:**
1. Nama Hewan
2. Jenis Hewan

**Signalment:**
3. Ras Hewan
4. Jenis Kelamin
5. Umur
6. ~~Catatan~~ → diganti **"Ciri Khusus"**

**File diubah:**
- `packages/shared/src/pet.ts` — rename field notes → ciriKhusus / tambah ras, umur
- `apps/backend/src/models/pet.model.ts` — schema
- `apps/frontend/app/dashboard/pets/page.tsx` — form tambah/edit pasien
- `apps/frontend/app/dashboard/pets/[id]/page.tsx` — detail pasien

---

### 20. Urutan & Rename Menu Sidebar

**Masalah:** Sidebar saat ini: Dashboard, Pemilik, Pasien, Produk & Jasa, Transaksi, Rekam Medis. Tidak sesuai alur kerja klinik (klien → pasien baru/lama → pemeriksaan).

**Solusi:** Urutan & nama menu baru:
| Urutan | Menu | Keterangan |
|--------|------|------------|
| 1 | Dashboard | tetap |
| 2 | **Klien** | rename dari "Pemilik" (ex-Customer) |
| 3 | **Pasien Baru** | rename dari "Pasien" (tambah pasien baru) |
| 4 | **Pasien Lama** | rename dari "Konsultasi Baru" (konsultasi pasien yang sudah terdaftar) |
| 5 | Rekam Medis | tetap |
| 6 | **Jasa** | split dari "Produk & Jasa" — filter type=service |
| 7 | **Obat** | split dari "Produk & Jasa" — filter type=medicine |
| 8 | **Barang** | split dari "Produk & Jasa" — filter type=physical |
| 9 | Transaksi | tetap |

**Catatan:** Menu 6-8 sudah jadi 3 halaman terpisah: `/dashboard/services` (Jasa), `/dashboard/obat` (Obat), `/dashboard/products` (Barang)

**File diubah:**
- `apps/frontend/app/dashboard/layout.tsx` — urutan & label menu
- `apps/frontend/app/dashboard/customers/page.tsx` — judul Klien
- `apps/frontend/app/dashboard/pets/page.tsx` — judul Pasien Baru
- `apps/frontend/app/dashboard/vet-sales/create/page.tsx` — jadi Pasien Lama

---

### 21. Bug — Icon Delete Tidak Berhasil Delete

**Masalah:** Icon delete (trash) di beberapa halaman tidak melakukan delete. Data tidak terhapus saat tombol ditekan.

**Solusi:** Audit semua tombol delete:
1. Cek apakah `apiFetch` DELETE dipanggil dengan benar (`method: "DELETE"`)
2. Cek apakah `Modal.confirm` menggunakan `useAntdModal()` (bukan static `Modal.confirm`)
3. Cek backend route — apakah role user punya akses (misal kasir tidak boleh delete?)
4. Cek response error — apakah error handling menampilkan pesan yang benar

**File yang perlu dicek:**
- `apps/frontend/app/dashboard/transactions/page.tsx`
- `apps/frontend/app/dashboard/pets/page.tsx`
- `apps/frontend/app/dashboard/customers/page.tsx`
- `apps/frontend/app/dashboard/products/page.tsx`
- `apps/backend/src/routes/*.route.ts` — role authorization


### 22. Tambah Pasien — Input Kondisional & Autocomplete

**Masalah:** Form tambah pasien saat ini:
- Bisa mengisi tanggal lahir DAN umur awal bersamaan (tidak konsisten)
- Jenis hewan, ras, ciri khusus hanya input bebas — tidak ada pilihan cepat dari data yang sudah ada

**Solusi:**

1. **Umur input kondisional** — gunakan radio button: `[📅 Tanggal Lahir] [🐣 Umur Awal]`
   - Pilih **Tanggal Lahir** → field DatePicker muncul, field umur awal hidden
   - Pilih **Umur Awal** → field umur (value + satuan bulan/tahun) muncul, DatePicker hidden
   - Tidak bisa keduanya terisi

2. **Autocomplete distinct values** — untuk field:
   - **Jenis Hewan** — dari distinct `kind` di database
   - **Ras Hewan** — dari distinct `breed` di database
   - **Ciri Khusus** — dari distinct `notes` di database
   - Pola: `AutoComplete` dengan `options` dari API distinct. Bisa pilih dari list, atau ketik bebas jika nilai belum ada di list

**Backend:** Tambah endpoint `GET /api/pets/distinct?field=kind|breed|notes` — mengembalikan array nilai unik.

**File diubah:**
- `apps/backend/src/services/pet.service.ts` + controller + route — endpoint distinct
- `apps/frontend/app/dashboard/pets/page.tsx` — radio umur + autocomplete

---

### 23. Pasien Lama (Konsultasi) — Riwayat Medis & Barang

**Masalah:** Halaman konsultasi (`/dashboard/consultations/new`):
- Tidak menampilkan riwayat medis pasien setelah pasien dipilih
- Diagnosis sudah autocomplete (item 17) tapi field lainnya belum lengkap
- Hanya bisa tambah Jasa & Obat — belum bisa tambah Barang
- Adjust flow lengkapnya
    Kasir 
    - input data klien
    - input data hewan
    - masukin data S dan O

    hewan masuk ruang periksa

    Dokter 
    - masukin data A dan P
    - Diagnosa
    - Input tindakan 
    - input resep obat
    - pemberian obat suntik

    Kasir 
    - menerima tagihan dr dokter
    - klien nunggu obat racik
    - klien bayar
- Setelah simpan, tidak diarahkan ke halaman riwayat medis


**Solusi:**

1. **Riwayat medis pasien** — setelah pasien dipilih, tampilkan komponen riwayat (reuse dari Riwayat Medis di Detail Pasien)

2. **Diagnosis autocomplete** — sudah ada (item 17), pastikan tetap berjalan

3. **Tambah Barang** — tambah editor baru di samping Tindakan (Jasa) & Resep Obat:
   - Options dari `/api/products` (productType != obat)
   - Item barang masuk ke `treatments` atau field baru `goods[]` di rekam medis → item transaksi type physical

4. **Pemberian obat suntik** — jadikan **catatan di resep** (field `notes` pada prescription item), bukan item transaksi terpisah

5. **Rekam medis DIHITUNG FINAL** — tidak ada konsep draft. Begitu disimpan, rekam medis langsung final + transaksi dibuat. Alur kasir→dokter→kasir tetap satu form konsultasi.

6. **Redirect setelah simpan** — `router.push(\`/dashboard/medical-histories/${res.data._id}\`)` (sudah ada di handleSubmit — verify)

**File diubah:**
- `apps/frontend/app/dashboard/consultations/new/page.tsx`
- `packages/shared/src/medical-history.ts` — field goods (opsional)
- `apps/backend/src/services/medical-history.service.ts` — proyeksi goods ke transaksi

---

### 24. Tambah Obat — Autocomplete Kategori/Satuan

**Masalah:** Form tambah obat (halaman `/dashboard/obat`) masih pakai input bebas untuk kategori & satuan, dan wording-nya "Tambah Barang" bukan "Tambah Obat". Belum ada pembeda barang vs obat.

**Solusi:**

1. **Autocomplete distinct values** — field:
   - **Kategori** — dari distinct `category` di database (filter: yang sudah dipakai untuk barang)
   - **Satuan** — dari distinct `unit` di database
   - Pola: bisa pilih dari list atau ketik bebas

**File diubah:**
- `apps/backend/src/services/product.service.ts` + controller + route — endpoint distinct (pola sama seperti item 22)
- `apps/frontend/app/dashboard/products/page.tsx` — autocomplete

---

### 25. Transaksi Barang Baru — Fix CastError & Flow

**Masalah:** Halaman `/dashboard/transactions/create-shop`:
- Error backend: `CastError: Cast to ObjectId failed for value "physical" (type string) at path "_id" for model "Product"` — frontend mengirim `product._id` berupa string `"physical"` (salah struktur payload)
- Label masih "Pemilik" — harusnya "Klien"
- Tombol "Tambah produk" tidak berfungsi
- Setelah Proses Pembayaran sukses, tidak redirect ke halaman transaksi

**Solusi:**

1. **Fix CastError** — perbaiki payload item di frontend: kirim `{ productId, quantity }` (bukan `{ product: { _id, name, type } }`) sesuai `shopCreateSchema`. Backend `createShopTransaction` menerima `productId` + `quantity` (lihat `shopCreateSchema`)

2. **Label** — "Pemilik" → "Klien"

3. **Tambah produk** — perbaiki handler: `addToCart(productId)` harus menemukan produk dari list dengan `_id` yang benar, bukan string `"physical"`

4. **Redirect** — setelah sukses `router.push("/dashboard/transactions")`

**File diubah:**
- `apps/frontend/app/dashboard/transactions/create-shop/page.tsx`

## 🔜 Belum Dikerjakan

### 27. List Diagnosis — Template Obat/Jasa/Barang

**Masalah:** Diagnosis di form konsultasi (Pasien Lama, `/dashboard/consultations/new`) saat ini hanya autocomplete dari riwayat diagnosis lama (`/api/medical-histories/diagnoses` — distinct string dari rekam medis yang pernah dibuat). Tidak ada master data diagnosis. Dokter yang menangani diagnosis yang sama berulang kali harus mengisi ulang tindakan (jasa), resep obat, dan barang satu per satu di setiap konsultasi.

**Solusi:** Buat master data **List Diagnosis**:

1. **Entri list diagnosis** — satu entri = `nama diagnosis` + template berisi 3 kelompok item:
   - **Jasa** (`treatments`) — diambil dari Master Tindakan (`/api/services`)
   - **Obat** (`prescriptions`) — diambil dari Master Obat (`/api/products?productType=medicine`)
   - **Barang** (`goods`) — diambil dari Master Barang (`/api/products?productType=good`)
   - Setiap item template: `productId`, `name` (snapshot), `quantity`, `price` (snapshot dari master), plus `dosage`/`usage`/`notes` opsional untuk obat (mengikuti bentuk `PrescriptionItem` yang sudah ada)

2. **CRUD penuh** — entri list diagnosis bisa dibuat, diubah, dan dihapus. **Akses: role `admin`, `superadmin`, `doctor`** (kasir tidak bisa)

3. **Abaikan stok saat membuat/mengedit template** — produk dengan stok 0/habis TETAP bisa dipilih masuk template (pilihannya tidak di-filter stok). Validasi & pemotongan stok tetap berlaku normal saat transaksi dibuat — aturan bisnis yang sudah ada: transaksi hanya menagih stok tersedia, stok tidak pernah minus

**Alur di form konsultasi (`/dashboard/consultations/new`):**
1. Dokter pilih diagnosis (AutoComplete) — opsi digabung: master list diagnosis + distinct dari riwayat (master diutamakan)
2. Jika diagnosis terdaftar di master → item template **otomatis terisi** di editor **Tindakan (Jasa)**, **Resep Obat**, dan **Barang** — dokter tetap bisa mengubah/menghapus item yang terisi
3. Jika tidak terdaftar → seperti sekarang (editor kosong, dokter isi manual)
4. Simpan → rekam medis + transaksi dibuat seperti biasa (item template menjadi item transaksi)

**Backend:**
- Model baru `DiagnosisTemplate` — `{ name (unique), items: { treatments[], prescriptions[], goods[] } }`
- Service + controller + route baru — CRUD `/api/diagnosis-templates` (+ `?search=` untuk autocomplete)
- Autocomplete diagnosis: gabung master list + distinct riwayat (master diutamakan)

**Frontend:**
- Halaman manajemen baru `/dashboard/diagnoses` — tabel + modal create/edit, picker produk tanpa filter stok
- `/dashboard/consultations/new` — saat diagnosis dipilih & punya template, pre-fill editor

**File diubah:**
- Baru: `apps/backend/src/models/diagnosis-template.model.ts`, `diagnosis-template.service.ts`, `diagnosis-template.controller.ts`, `diagnosis-template.route.ts`
- Baru: `apps/frontend/app/dashboard/diagnoses/page.tsx`
- `apps/frontend/app/dashboard/layout.tsx` — menu baru "List Diagnosis" (visible untuk role admin/superadmin/doctor)
- `apps/frontend/app/dashboard/consultations/new/page.tsx` — pre-fill template saat diagnosis dipilih
- (opsional) `apps/backend/src/services/medical-history.service.ts` — gabung sumber autocomplete diagnosis