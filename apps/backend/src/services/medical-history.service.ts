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
    .populate("petId", "name kind breed")
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
      select: "name kind breed gender birthDate initialAge customerId",
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

async function enrichPrescriptions(prescriptions: any[]) {
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
      return p;
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

  const record = await MedicalHistoryModel.create({
    petId: input.petId,
    visitDate: input.visitDate,
    soap: input.soap,
    diagnosis: input.diagnosis,
    doctorId: new mongoose.Types.ObjectId(doctorId),
    treatments,
    prescriptions,
  });

  // Auto-create transaction (utang) dari tindakan & resep
  const customer = await CustomerModel.findById(pet.customerId).select("name").lean();
  const txn = await createTransactionFromMedicalHistory({
    medicalHistoryId: record._id.toString(),
    pet: { _id: pet._id, name: pet.name, kind: pet.kind },
    customer: customer ? { _id: customer._id, name: customer.name } : null,
    treatments,
    prescriptions,
    cashierId: doctorId,
    cashierName: doctorName,
  });

  const result = record.toObject() as any;
  return { ...result, transaction: txn };
}

// ──────────────────────────────────────────
// Update — memperbarui rekam medis + sinkron transaksi
// ──────────────────────────────────────────
export async function updateMedicalHistory(id: string, input: MedicalHistoryUpdateRequest) {
  const record = await MedicalHistoryModel.findById(id);
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  let treatments = input.treatments;
  let prescriptions = input.prescriptions;
  if (treatments) treatments = await enrichTreatments(treatments);
  if (prescriptions) prescriptions = await enrichPrescriptions(prescriptions);

  const patch: any = { ...input };
  if (treatments) patch.treatments = treatments;
  if (prescriptions) patch.prescriptions = prescriptions;

  const updated = await MedicalHistoryModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  if (!updated) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  // Sinkron transaksi terkait (hanya jika masih utang)
  const txn = await syncTransactionFromMedicalHistory({
    medicalHistoryId: id,
    treatments: treatments ?? updated.treatments ?? [],
    prescriptions: prescriptions ?? updated.prescriptions ?? [],
  });

  return { ...updated, transaction: txn };
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
      doctorId: r.doctorId,
      treatments: r.treatments,
      prescriptions: r.prescriptions,
      weight,
      temperature,
    };
  });

  const totalVisits = await MedicalHistoryModel.countDocuments({ petId });
  return { records: history as any, totalVisits };
}
