// ─────────────────────────────────────────────────────────────
// Seed List Diagnosis (DiagnosisTemplate) dari master Jasa & Obat
//
// Untuk setiap Jasa  → 1 template: { name: <nama jasa>, items.treatments: [jasa qty 1] }
// Untuk setiap Obat  → 1 template: { name: <nama obat>, items.prescriptions: [obat qty 1] }
//
// Idempotent: template dengan nama yang SUDAH ADA tidak ditimpa
// (aman dijalankan ulang; edit manual di halaman /dashboard/diagnoses tetap utuh).
//
// Cara pakai (dari root repo, .env tersedia):
//   npm run seed:diagnosis
// atau:
//   node scripts/seed-diagnosis-templates.mjs
// ─────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");
if (existsSync(envPath)) configDotenv({ path: envPath });

// URI mongo di-generate dari .env — sama seperti apps/backend/src/config/env.ts
const host = process.env.MONGODB_HOST || "localhost";
const user = process.env.MONGO_APP_USERNAME || "vetapp";
const pass = process.env.MONGO_APP_PASSWORD || "dev-app-password";
const uri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/vet-management?authSource=vet-management`;

async function main() {
  await mongoose.connect(uri);
  console.log(`✓ Terhubung ke MongoDB (${host})`);

  const db = mongoose.connection.db;

  // ── Kumpulkan master ──────────────────────────────────────
  // Jasa: semua yang tidak dinonaktifkan (field isActive tidak ada = aktif default)
  const services = await db
    .collection("services")
    .find({ isActive: { $ne: false } }, { projection: { _id: 1, name: 1 } })
    .toArray();
  // Obat: productType=medicine, SEMUA stok (stok 0 tetap boleh masuk template — aturan item 27)
  const medicines = await db
    .collection("products")
    .find({ productType: "medicine" }, { projection: { _id: 1, "product.name": 1 } })
    .toArray();

  console.log(`Master: ${services.length} jasa, ${medicines.length} obat`);

  // ── Upsert template (nama unik; $setOnInsert → nama yang ada TIDAK ditimpa) ──
  const bulk = [];

  for (const s of services) {
    bulk.push({
      updateOne: {
        filter: { name: s.name },
        update: {
          $setOnInsert: {
            name: s.name,
            items: {
              treatments: [{ productId: s._id, name: s.name, quantity: 1 }],
              prescriptions: [],
              goods: [],
            },
          },
        },
        upsert: true,
      },
    });
  }

  for (const m of medicines) {
    const name = m.product?.name;
    if (!name) continue;
    bulk.push({
      updateOne: {
        filter: { name },
        update: {
          $setOnInsert: {
            name,
            items: {
              treatments: [],
              prescriptions: [{ productId: m._id, name, quantity: 1 }],
              goods: [],
            },
          },
        },
        upsert: true,
      },
    });
  }

  if (bulk.length === 0) {
    console.log("Tidak ada jasa/obat di master — tidak ada template dibuat.");
    await mongoose.disconnect();
    return;
  }

  const result = await db.collection("diagnosistemplates").bulkWrite(bulk, { ordered: false });

  console.log(`✓ Selesai: ${result.upsertedCount} template dibuat, ${result.matchedCount} sudah ada (di-skip).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Gagal seed diagnosis:", err);
  process.exit(1);
});
