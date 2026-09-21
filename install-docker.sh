#!/bin/bash

# Hentikan eksekusi jika terjadi error
set -e

echo "=== 1. Memperbarui sistem dan menginstall dependensi ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "=== 2. Menambahkan kunci GPG resmi Docker ==="
sudo install -m 0755 -d /etc/apt/keyrings
if [ -f /etc/apt/keyrings/docker.gpg ]; then
    sudo rm /etc/apt/keyrings/docker.gpg
fi
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "=== 3. Menambahkan repository resmi Docker ==="
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "=== 4. Menginstall Docker Engine & Docker Compose ==="
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== 5. Menambahkan user saat ini ke grup docker (Non-Root) ==="
sudo usermod -aG docker $USER

echo "=== 6. Memverifikasi Instalasi ==="
sudo docker run hello-world

echo ""
echo "=========================================================="
echo " Instalasi Docker berhasil!"
echo " Silakan LOGOUT lalu LOGIN kembali (atau jalankan 'newgrp docker')"
echo " agar Anda dapat menggunakan Docker tanpa perintah 'sudo'."
echo "=========================================================="