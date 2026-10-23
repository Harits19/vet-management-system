# Deploy

Dokumen lengkap (on-premise, LAN, backup, troubleshooting): `docs/on-premise-deployment.md`.
Versi ringkas 6 perintah: `docs/deploy-quickstart.md`.

Jalur cepat — VPS + domain publik (Let's Encrypt):

VPS: `ubuntu@43.157.225.200`, repo di `/home/ubuntu/vet-management-system`.

```bash
ssh ubuntu@43.157.225.200
git clone <url-repo> && cd vet-management-system

bash install-docker.sh   # sekali saja, lalu logout/login
bash deploy.sh           # build + up + sertifikat HTTPS otomatis
```

Syarat: DNS A record domain → IP VPS, port 80 & 443 terbuka.
Domain diambil dari `FRONTEND_ORIGINS`, email dari `CERTBOT_EMAIL` (keduanya di `.env`).

Selesai. Buka `https://<domain>`, login `superadmin` / `DEFAULT_USER_PASSWORD` (`.env`).

Deploy ulang (update kode) = `bash deploy.sh` lagi.

Jalur on-premise (LAN / tanpa internet):

```bash
bash scripts/vet-deploy.sh init <domain-atau-IP> <email-admin>  # .env + secret acak
bash scripts/vet-deploy.sh cert self-signed                     # atau: cert lets-encrypt
bash scripts/vet-deploy.sh doctor
bash scripts/vet-deploy.sh up
```

Alternatif: `SELF_SIGNED=1 bash deploy.sh` (setara `cert self-signed` + `up`).
Perintah lain: `bash scripts/vet-deploy.sh help` — `status`, `logs`, `backup`, `restore`,
`update`, `mongo`, `reset`.

Di VPS, ganti dulu `JWT_SECRET`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_APP_PASSWORD`,
`DEFAULT_USER_PASSWORD` kalau tidak mau pakai default repo (helper `init` melakukannya otomatis).

Detail nilai `.env` & aturan kerja: `AGENTS.md`.
