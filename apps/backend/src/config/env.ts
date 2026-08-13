import { configDotenv } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

// Always read the root .env — for development AND production (no .env.example).
// npm workspace scripts run with cwd = the workspace folder (apps/backend), so
// resolve the file from the repo root.
const repoRoot = path.resolve(import.meta.dirname, "../../../../");
const envPath = path.join(repoRoot, ".env");
if (!existsSync(envPath)) {
  console.warn(`⚠️  ${envPath} tidak ditemukan. Copy template dulu: cp .env.example .env`);
}
configDotenv({ path: envPath });

const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  // URI mongo di-generate di sini dari MONGODB_HOST + kredensial aplikasi
  // (tidak ada key MONGODB_URI di .env — host saja yang dikonfigurasi)
  MONGODB_URI: (() => {
    const host = process.env.MONGODB_HOST || "localhost";
    const user = process.env.MONGO_APP_USERNAME || "vetapp";
    const pass = process.env.MONGO_APP_PASSWORD || "dev-app-password";
    // Nama DB bisa di-override per instance (default: vet-management).
    const db = process.env.MONGO_APP_DATABASE || "vet-management";
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/${db}?authSource=${db}`;
  })(),
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  DEFAULT_USER_PASSWORD: process.env.DEFAULT_USER_PASSWORD || "password123",
  ENABLE_SEED: process.env.ENABLE_SEED === "true",
  // Data toko/klinik — dipakai kop surat & rekam medis (diambil frontend via GET /api/config/store)
  STORE_NAME: process.env.STORE_NAME || "Wedi Animal Care",
  STORE_ADDRESS: process.env.STORE_ADDRESS || "",
  STORE_WHATSAPP: process.env.STORE_WHATSAPP || "",
  STORE_PHONE: process.env.STORE_PHONE || "",
  // Absensi: titik lokasi kantor (kosong = validasi lokasi dimatikan) + ambang kecocokan wajah
  OFFICE_LAT: process.env.OFFICE_LAT || "",
  OFFICE_LNG: process.env.OFFICE_LNG || "",
  OFFICE_RADIUS_METERS: Number(process.env.OFFICE_RADIUS_METERS || 200),
  ATTENDANCE_FACE_THRESHOLD: Number(process.env.ATTENDANCE_FACE_THRESHOLD || 0.6),
  // Mode absensi: face | qr | both — default QR (wajah bisa dinonaktifkan, cukup ganti env)
  ATTENDANCE_MODE: process.env.ATTENDANCE_MODE || "qr",
  // Secret QR statis — dikodekan ke QR (isi QR = "VET-ABSEN:<secret>"), dipajang di tempat absen
  ATTENDANCE_QR_SECRET: process.env.ATTENDANCE_QR_SECRET || "vet-attendance-2026",
};

export default env;
