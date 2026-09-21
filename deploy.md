# Deploy

VPS: `ubuntu@43.157.243.138`, repo di `/home/ubuntu/vet-management-system`.

```bash
ssh ubuntu@43.157.243.138
git clone <url-repo> && cd vet-management-system

bash install-docker.sh   # sekali saja, lalu logout/login
bash deploy.sh           # build + up + sertifikat HTTPS otomatis
```

Syarat: DNS A record domain → IP VPS, port 80 & 443 terbuka.
Domain diambil dari `FRONTEND_ORIGINS`, email dari `CERTBOT_EMAIL` (keduanya di `.env`).

Selesai. Buka `https://<domain>`, login `superadmin` / `DEFAULT_USER_PASSWORD` (`.env`).

Deploy ulang (update kode) = `bash deploy.sh` lagi.
Di VPS, ganti dulu `JWT_SECRET`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_APP_PASSWORD`,
`DEFAULT_USER_PASSWORD` kalau tidak mau pakai default repo.

Detail nilai `.env` & aturan kerja: `AGENTS.md`.
