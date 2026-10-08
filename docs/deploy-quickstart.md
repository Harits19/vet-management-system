# Deploy Cepat — VPS Baru

Versi panjang (arsitektur, mode LAN, backup, troubleshooting lengkap):
`docs/on-premise-deployment.md`.

## 1. Syarat — cek 5 hal ini dulu

| #   | Syarat                                                                        | Perintah cek                       |
| --- | ----------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Ubuntu 22.04/24.04, akses `sudo`, RAM ≥ 2 GB (+ swap 2 GB), disk sisa ≥ 20 GB | `free -m`, `df -h /`               |
| 2   | Docker Engine + plugin compose                                                | `docker compose version`           |
| 3   | Bisa baca repo (repo privat → SSH key sudah terpasang di VPS)                 | `git ls-remote <url-repo> HEAD`    |
| 4   | Port 80 & 443 bebas (tidak dipakai nginx/apache lain)                         | `ss -ltnp \| grep -E ':(80\|443)'` |
| 5   | Domain → A record ke IP VPS — **hanya** untuk HTTPS Let's Encrypt             | `getent hosts <domain>`            |

Tanpa domain atau tanpa internet? Lewati nomor 5, pakai sertifikat self-signed (langkah 3).

## 2. Enam perintah

```bash
git clone <url-repo> vet-management-system && cd vet-management-system

bash install-docker.sh                                    # lewati kalau docker sudah ada, lalu logout/login
bash scripts/vet-deploy.sh init <domain-atau-IP> <email>   # buat .env, secret acak — CATAT password yang tampil
bash scripts/vet-deploy.sh cert lets-encrypt               # LAN/tanpa internet: cert self-signed
bash scripts/vet-deploy.sh doctor                          # harus "Semua pemeriksaan wajib lolos"
bash scripts/vet-deploy.sh up                              # build + start + tunggu /api/health
```

Selesai: buka `https://<domain>` → login `superadmin` / `DEFAULT_USER_PASSWORD` (ditampilkan `init`).

Belum ada `scripts/vet-deploy.sh` (branch lama)? Pakai jalur lama:
`bash deploy.sh` (Let's Encrypt) atau `SELF_SIGNED=1 bash deploy.sh` (LAN, tanpa internet).

## 3. Kalau gagal

| Gejala                                          | Lakukan                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `docker: command not found` / permission denied | Jalankan `install-docker.sh`, lalu logout/login (grup `docker`)          |
| `doctor`: ssl/fullchain.pem belum ada           | `bash scripts/vet-deploy.sh cert self-signed` lalu `up`                  |
| nginx restart-loop `cannot load certificate`    | sama seperti di atas — nginx tidak bisa start tanpa sertifikat           |
| `cert lets-encrypt` gagal di HTTP-01            | DNS belum ke IP VPS, port 80 tertutup, atau port 80 dipakai layanan lain |
| Halaman 502 Bad Gateway                         | `bash scripts/vet-deploy.sh logs backend` (health check belum selesai)   |
| Build mati / OOM saat `up`                      | Tambah swap ≥ 2 GB, ulangi `up`                                          |
| `ssl/` permission denied saat buat sertifikat   | `sudo chown -R $USER: ssl certbot-webroot`                               |
| Lupa password login                             | `grep DEFAULT_USER_PASSWORD .env`                                        |

Diagnosa menyeluruh sekali jalan: `bash scripts/vet-deploy.sh doctor`
(setara `npm run deploy:doctor`).

## 4. Habis deploy, jangan lupa

- `bash scripts/vet-deploy.sh backup` sebelum setiap update kode — jadwalkan harian lewat cron
  (contoh ada di `docs/on-premise-deployment.md` bagian 8).
- Set `ENABLE_SEED=false` setelah user awal terbentuk, lalu ganti password `superadmin`,
  `kasir1`, `kasir2`, `dokter` dari UI (semua dibuat dari `DEFAULT_USER_PASSWORD`).
- Update kode: `bash scripts/vet-deploy.sh update` (setara `git pull --ff-only` + `up`).
