import { MedicalHistoryModel, PetModel, CustomerModel, ServiceModel, ProductModel } from "../models/index.js";
import type { MedicalHistoryCreateRequest, MedicalHistoryUpdateRequest, MedicalHistoryFilter } from "@vet/shared";
import {
  createTransactionFromMedicalHistory,
  syncTransactionFromMedicalHistory,
  deleteTransactionForMedicalHistory,
} from "./transaction.service.js";
import mongoose from "mongoose";

// ──────────────────────────────────────────
// List
// ──────────────────────────────────────────
export async function listMedicalHistories(filter: MedicalHistoryFilter) {
  const { page, limit, petId, doctorId, startDate, endDate, sortBy, order } = filter;
  const query: any = {};
  if (petId) query.petId = petId;
  if (doctorId) query.doctorId = doctorId;
  if (startDate || endDate) {
    query.visitDate = {};
    if (startDate) query.visitDate.$gte = new Date(startDate);
    if (endDate) query.visitDate.$lte = new Date(endDate);
  }
  const total = await MedicalHistoryModel.countDocuments(query);
  const data = await MedicalHistoryModel.find(query)
    .populate("petId", "name kind breed furColor")
    .populate("doctorId", "name")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

// ──────────────────────────────────────────
// Get detail — lengkap dgn data pasien & pemilik
// ──────────────────────────────────────────
export async function getMedicalHistory(id: string) {
  const record = await MedicalHistoryModel.findById(id)
    .populate({
      path: "petId",
      select: "name kind breed furColor gender birthDate initialAge customerId createdAt",
      populate: { path: "customerId", select: "name whatsapp address" },
    })
    .populate("doctorId", "name")
    .lean();
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });
  return record as any;
}

// ──────────────────────────────────────────
// Auto-populate nama & harga dari master product
// ──────────────────────────────────────────
async function enrichTreatments(treatments: any[]) {
  return Promise.all(
    treatments.map(async (t) => {
      if (t.productId) {
        const svc = await ServiceModel.findById(t.productId).lean();
        if (svc) {
          return {
            ...t,
            name: t.name || svc.name,
            price: t.price ?? svc.price,
            quantity: t.quantity ?? 1,
          };
        }
      }
      return { ...t, quantity: t.quantity ?? 1 };
    })
  );
}

// Obat bebas (diketik manual di konsultasi): otomatis dicatat ke master obat
// (ProductModel, productType medicine) supaya tetap terpantau di inventory —
// harga & stok 0 (belum diisi user). Kalau nama sudah ada di master, tidak dibuat duplikat.
async function ensureFreeTextMedicine(name: string, unit?: string) {
  const cleanName = (name || "").trim();
  if (!cleanName) return;
  const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exists = await ProductModel.findOne({
    productType: "medicine",
    "product.name": { $regex: `^${escaped}$`, $options: "i" },
  }).lean();
  if (exists) return;
  await ProductModel.create({
    productType: "medicine",
    category: "Obat Bebas",
    product: { name: cleanName },
    pricing: { cost: 0, selling: 0 },
    inventory: { quantity: 0 },
    unit: unit?.trim() || undefined,
    isActive: true,
  });
}

async function enrichPrescriptions(prescriptions: any[]) {
  // Dedup nama dalam satu batch supaya tidak dobel-create master obat
  const seen = new Set<string>();
  return Promise.all(
    prescriptions.map(async (p) => {
      if (p.productId) {
        const prod = await ProductModel.findById(p.productId).lean();
        if (prod) {
          return {
            ...p,
            name: p.name || prod.product.name,
            price: p.price ?? prod.pricing.selling,
          };
        }
      }
      // Obat bebas (tanpa master): catat ke master obat utk inventory, lalu
      // buang productId kosong supaya tidak di-cast ke ObjectId oleh mongoose
      // dan tidak dibuatkan item transaksi (tanpa harga & stok).
      const { productId, ...rest } = p;
      const key = String(rest.name || "").trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        await ensureFreeTextMedicine(rest.name, rest.unit);
      }
      return rest;
    })
  );
}

// Barang non-obat (good) — sama seperti treatments tapi dari ProductModel
async function enrichGoods(goods: any[]) {
  return Promise.all(
    goods.map(async (g) => {
      if (g.productId) {
        const prod = await ProductModel.findById(g.productId).lean();
        if (prod) {
          return {
            ...g,
            name: g.name || prod.product.name,
            price: g.price ?? prod.pricing.selling,
            quantity: g.quantity ?? 1,
          };
        }
      }
      return { ...g, quantity: g.quantity ?? 1 };
    })
  );
}

// ──────────────────────────────────────────
// Create — SOAP + Diagnosis + Tindakan + Resep
// Otomatis membuat transaksi (type: vet) dari tindakan & resep.
// ──────────────────────────────────────────
export async function createMedicalHistory(input: MedicalHistoryCreateRequest, doctorId: string, doctorName: string) {
  const pet = await PetModel.findById(input.petId);
  if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });

  const treatments = await enrichTreatments(input.treatments || []);
  const prescriptions = await enrichPrescriptions(input.prescriptions || []);
  const goods = await enrichGoods(input.goods || []);

  const record = await MedicalHistoryModel.create({
    petId: input.petId,
    visitDate: input.visitDate,
    soap: input.soap,
    diagnosis: input.diagnosis,
    doctorId: new mongoose.Types.ObjectId(doctorId),
    treatments,
    prescriptions,
    goods,
  });

  // Auto-create transaction (utang) dari tindakan & resep & barang.
  // Rekam medis TETAP tersimpan walau transaksi gagal dibuat (mis. stok kurang) —
  // kegagalan transaksi dilaporkan lewat transactionError.
  let txn: any = null;
  let transactionError: string | undefined;
  try {
    const customer = await CustomerModel.findById(pet.customerId).select("name").lean();
    txn = await createTransactionFromMedicalHistory({
      medicalHistoryId: record._id.toString(),
      pet: { _id: pet._id, name: pet.name, kind: pet.kind },
      customer: customer ? { _id: customer._id, name: customer.name } : null,
      treatments,
      prescriptions,
      goods,
      cashierId: doctorId,
      cashierName: doctorName,
    });
  } catch (err: any) {
    transactionError = err?.message || "Transaksi gagal dibuat";
  }

  const result = record.toObject() as any;
  return { ...result, transaction: txn, transactionError, transactionWarnings: (txn as any)?.warnings ?? [] };
}

// ──────────────────────────────────────────
// Update — memperbarui rekam medis + sinkron transaksi
// ──────────────────────────────────────────
export async function updateMedicalHistory(id: string, input: MedicalHistoryUpdateRequest) {
  const record = await MedicalHistoryModel.findById(id);
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  let treatments = input.treatments;
  let prescriptions = input.prescriptions;
  let goods = input.goods;
  if (treatments) treatments = await enrichTreatments(treatments);
  if (prescriptions) prescriptions = await enrichPrescriptions(prescriptions);
  if (goods) goods = await enrichGoods(goods);

  const patch: any = { ...input };
  if (treatments) patch.treatments = treatments;
  if (prescriptions) patch.prescriptions = prescriptions;
  if (goods) patch.goods = goods;

  const updated = await MedicalHistoryModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  if (!updated) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  // Sinkron transaksi terkait (hanya jika masih utang).
  // Rekam medis TETAP ter-update walau sinkronisasi gagal (mis. stok kurang) —
  // kegagalan dilaporkan lewat transactionError.
  let txn: any = null;
  let transactionError: string | undefined;
  try {
    txn = await syncTransactionFromMedicalHistory({
      medicalHistoryId: id,
      treatments: treatments ?? updated.treatments ?? [],
      prescriptions: prescriptions ?? updated.prescriptions ?? [],
      goods: goods ?? updated.goods ?? [],
    });
  } catch (err: any) {
    transactionError = err?.message || "Sinkronisasi transaksi gagal";
  }

  return { ...updated, transaction: txn, transactionError, transactionWarnings: (txn as any)?.warnings ?? [] };
}

// ──────────────────────────────────────────
// Delete — hapus rekam medis + transaksi terkait
// ──────────────────────────────────────────
export async function deleteMedicalHistory(id: string) {
  const record = await MedicalHistoryModel.findByIdAndDelete(id).lean();
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  const txn = await deleteTransactionForMedicalHistory(id);
  return { ...record, transaction: txn };
}

// ──────────────────────────────────────────
// Summary per pasien + riwayat Berat Badan & Suhu
// ──────────────────────────────────────────
export async function getMedicalHistorySummary(petId: string) {
  const records = await MedicalHistoryModel.find({ petId })
    .populate("doctorId", "name")
    .sort({ visitDate: -1 })
    .limit(10)
    .lean();

  const history = records.map((r: any) => {
    const items = r.soap?.objective?.physicalExam ?? [];
    const weight = items.find((i: any) => i.key === "weight")?.value;
    const temperature = items.find((i: any) => i.key === "temperature")?.value;
    return {
      _id: r._id,
      visitDate: r.visitDate,
      diagnosis: r.diagnosis,
      complaint: r.soap?.subjective?.complaint,
      doctorId: r.doctorId,
      treatments: r.treatments,
      prescriptions: r.prescriptions,
      goods: r.goods,
      weight,
      temperature,
    };
  });

  const totalVisits = await MedicalHistoryModel.countDocuments({ petId });
  return { records: history as any, totalVisits };
}
