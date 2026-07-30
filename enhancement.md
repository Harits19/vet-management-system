# Enhancement & Bug Fix

## 1. Tambah Pasien — Pemilik Tidak Ditemukan

**Permasalahan:** Saat user menambah pasien hewan, jika pemilik (customer) tidak ada di hasil search atau data kosong, tidak ada aksi untuk membuat pemilik baru.

**Solusi:** Tampilkan tombol **"Tambah Pemilik Baru"** yang mengarahkan ke halaman `/dashboard/customers/create`, baik saat hasil search kosong maupun saat daftar pemilik kosong sejak awal.

---

## 2. Error Handling — Ant Design Static message

**Error:**
```
Warning: [antd: message] Static function can not consume context like dynamic theme.
Please use 'App' component instead.
```

**Lokasi:** `app\dashboard\sales\page.tsx:111`

**Penyebab:** Pemanggilan `message.error()` via static function di luar komponen `App`.

**Solusi:** Ganti semua `message.error/success/warning` menjadi menggunakan `App.useApp()` hook atau gunakan `antd` `App` component wrapper di root layout. Contoh:

```tsx
// providers.tsx
import { App } from "antd";

export default function Providers({ children }) {
  return (
    <ConfigProvider>
      <App>{children}</App>
    </ConfigProvider>
  );
}

// Di komponen:
import { App } from "antd";
const { message } = App.useApp();
message.error("...");
```

---

## 3. Transaksi Dokter — Tambah Pasien Baru dari Select

**Permasalahan:** Di halaman Transaksi Dokter Baru, select pemilik (customer) tidak bisa menambahkan pasien baru jika pasien tersebut belum terdaftar.

**Solusi:** Tambahkan opsi/button **"Tambah Pasien Baru"** di dalam atau di samping select pasien yang mengarahkan ke halaman `/dashboard/pets/create`, lalu kembali dengan data pasien terpilih.

---

## 4. Routing — Redirect Base URL & Login Session

| Route | Behavior |
|-------|----------|
| `/` (base) | Redirect ke `/login` |
| `/login` | Jika sudah login (ada sesi), redirect ke `/dashboard` |
| `/dashboard` | Jika tidak ada sesi, redirect ke `/login` |

**Lokasi implementasi:**
- `app/page.tsx` — redirect ke `/login`
- `app/login/page.tsx` — cek sesi, jika ada redirect ke `/dashboard`
- `app/dashboard/layout.tsx` — sudah ada pengecekan sesi (saat ini sudah berfungsi)
