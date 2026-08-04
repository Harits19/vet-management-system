// ─────────────────────────────────────────────────────────────
// Seed List Diagnosis ASLI (standar medis veteriner umum)
//
// Setiap entri = nama diagnosis + template item yang relevan,
// diambil dari master yang SUDAH ADA di database (services = jasa,
// products productType=medicine = obat, productType=good = barang).
// Item disimpan { productId, name (snapshot), quantity, dosage? } —
// harga di-GET dari master saat diterapkan (aturan item 27).
//
// Idempotent: template dengan nama yang sudah ada TIDAK ditimpa.
//
// Cara pakai (dari root repo, .env tersedia):
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

const host = process.env.MONGODB_HOST || "localhost";
const user = process.env.MONGO_APP_USERNAME || "vetapp";
const pass = process.env.MONGO_APP_PASSWORD || "dev-app-password";
const uri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/vet-management?authSource=vet-management`;

// ── Daftar diagnosis asli + template (nama master HARUS persis) ──
// treatments = nama jasa | prescriptions = nama obat | goods = nama barang
const DIAGNOSES = [
  {
    name: "Vaksinasi Kucing (FVRCP)",
    treatments: ["VAKSINASI FELOCELL 3", "Konsultasi"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Vaksinasi Rabies",
    treatments: ["VAKSINASI RABIES", "Konsultasi"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Vaksinasi Anjing (DHPP)",
    treatments: ["VAKSINASI VANGUARD 5L", "Konsultasi"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Cacingan (Deworming)",
    treatments: ["Konsultasi", "OBAT CACING 3.1 - 4 Kg"],
    prescriptions: ["PYRANTEL PAMOATE"],
    goods: [],
  },
  {
    name: "Scabies / Kutu",
    treatments: ["Konsultasi", "GROOMING KUTU", "TETES KUTU /Kg"],
    prescriptions: ["Ivermectin"],
    goods: [],
  },
  {
    name: "Otitis / Infeksi Telinga",
    treatments: ["Konsultasi", "RECO TETES TELINGA", "ERLAMYCETIN TETES TELINGA"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Konjungtivitis / Infeksi Mata",
    treatments: ["Konsultasi", "RECO TETES MATA", "ERLAMYCETIN TETES MATA", "FLOXA TETES MATA"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Dermatitis / Jamur Kulit",
    treatments: ["Konsultasi", "GROOMING JAMUR"],
    prescriptions: ["DEXTEEM PLUS", "CTM"],
    goods: [],
  },
  {
    name: "Muntah (Emesis)",
    treatments: ["Konsultasi", "OBAT SUNTIK"],
    prescriptions: ["ONDANSENTRON", "RANITIDINE"],
    goods: [],
  },
  {
    name: "Diare",
    treatments: ["Konsultasi"],
    prescriptions: ["NORIT", "METRONIDAZOLE", "RANITIDINE"],
    goods: [],
  },
  {
    name: "Flu / Infeksi Saluran Pernapasan",
    treatments: ["Konsultasi", "OBAT SUNTIK"],
    prescriptions: ["AMOXICILLIN", "MIRAVON (BROMHEXINE HCL)", "Vitamin B"],
    goods: [],
  },
  {
    name: "Gastritis",
    treatments: ["Konsultasi"],
    prescriptions: ["RANITIDINE", "ONDANSENTRON"],
    goods: [],
  },
  {
    name: "Anoreksia (Tidak Mau Makan)",
    treatments: ["Konsultasi", "OBAT SUNTIK"],
    prescriptions: ["MIRZAP (MIRTAZAPINE)", "Vitamin B Complex"],
    goods: [],
  },
  {
    name: "Dehidrasi",
    treatments: ["Konsultasi", "JASA PEMASANGAN INFUS"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Luka / Trauma",
    treatments: ["Konsultasi", "TINDAKAN PEMBERSIHAN LUKA SEDANG", "OBAT SALEP LUKA"],
    prescriptions: ["AMOX-CLAV"],
    goods: [],
  },
  {
    name: "Kastrasi Kucing",
    treatments: ["OP KASTRASI KUCING", "Konsultasi"],
    prescriptions: ["Carprofen", "AMOXICILLIN"],
    goods: [],
  },
  {
    name: "Sterilisasi Betina (OH)",
    treatments: ["OP OVARIOHISTEREKTOMI KUCING", "Konsultasi"],
    prescriptions: ["Carprofen", "AMOXICILLIN"],
    goods: [],
  },
  {
    name: "Cek Kesehatan Rutin",
    treatments: ["Konsultasi", "CEK HEMATOLOGI RUTIN KUCING"],
    prescriptions: [],
    goods: [],
  },
  {
    name: "Feline Panleukopenia (FPV)",
    treatments: ["Konsultasi", "RAPID TEST FPV+FCOV+Giardia"],
    prescriptions: ["ONDANSENTRON", "Vitamin B Complex"],
    goods: [],
  },
  {
    name: "Distemper Anjing (CDV)",
    treatments: ["Konsultasi", "OBAT SUNTIK"],
    prescriptions: ["AMOXICILLIN", "Vitamin B Complex"],
    goods: [],
  },
];

async function main() {
  await mongoose.connect(uri);
  console.log(`✓ Terhubung ke MongoDB (${host})`);
  const db = mongoose.connection.db;

  // ── Index master by name ──
  const services = await db
    .collection("services")
    .find({ isActive: { $ne: false } }, { projection: { _id: 1, name: 1 } })
    .toArray();
  const medicines = await db
    .collection("products")
    .find({ productType: "medicine" }, { projection: { _id: 1, "product.name": 1 } })
    .toArray();
  const goods = await db
    .collection("products")
    .find({ productType: "good" }, { projection: { _id: 1, "product.name": 1 } })
    .toArray();

  const normalize = (n) => (n || "").trim().toLowerCase();
  const serviceMap = new Map(services.map((s) => [normalize(s.name), s._id]));
  const medicineMap = new Map(medicines.map((m) => [normalize(m.product?.name), m._id]));
  const goodsMap = new Map(goods.map((g) => [normalize(g.product?.name), g._id]));

  const bulk = [];
  let missing = new Set();

  for (const d of DIAGNOSES) {
    const item = (name, map, dosage) => {
      const id = map.get(normalize(name));
      if (!id) {
        missing.add(name);
        return null;
      }
      return { productId: id, name: name.trim(), quantity: 1, ...(dosage ? { dosage } : {}) };
    };

    const treatments = d.treatments.map((n) => item(n, serviceMap)).filter(Boolean);
    const prescriptions = d.prescriptions.map((n) => item(n, medicineMap)).filter(Boolean);
    const goodsItems = d.goods.map((n) => item(n, goodsMap)).filter(Boolean);

    bulk.push({
      updateOne: {
        filter: { name: d.name },
        update: {
          $setOnInsert: {
            name: d.name,
            items: { treatments, prescriptions, goods: goodsItems },
          },
        },
        upsert: true,
      },
    });
  }

  if (missing.size > 0) {
    console.warn(`⚠️  Master tidak ditemukan (template dibuat tanpa item ini): ${[...missing].join(", ")}`);
  }

  const result = await db.collection("diagnosistemplates").bulkWrite(bulk, { ordered: false });
  console.log(`✓ Selesai: ${result.upsertedCount} template dibuat, ${result.matchedCount} sudah ada (di-skip).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Gagal seed diagnosis:", err);
  process.exit(1);
});
