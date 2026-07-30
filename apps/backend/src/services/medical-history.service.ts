import { MedicalHistoryModel, PetModel, ProductModel } from "../models/index.js";
import type { MedicalHistoryCreateRequest, MedicalHistoryUpdateRequest, MedicalHistoryFilter } from "@vet/shared";
import mongoose from "mongoose";

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
    .populate("petId", "name kind")
    .populate("doctorId", "name")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getMedicalHistory(id: string) {
  const record = await MedicalHistoryModel.findById(id)
    .populate("petId", "name kind gender customerId")
    .populate("doctorId", "name")
    .lean();
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });
  return record as any;
}

export async function createMedicalHistory(input: MedicalHistoryCreateRequest, doctorId: string) {
  // Auto-populate treatment & prescription names/prices from products if not provided
  const treatments = await Promise.all(
    input.treatments.map(async (t) => {
      if (!t.name && t.productId) {
        const prod = await ProductModel.findById(t.productId).lean();
        if (prod) return { ...t, name: prod.product.name, price: t.price || prod.pricing.selling };
      }
      return t;
    })
  );
  const prescriptions = await Promise.all(
    input.prescriptions.map(async (p) => {
      if (!p.name && p.productId) {
        const prod = await ProductModel.findById(p.productId).lean();
        if (prod) return { ...p, name: prod.product.name, price: p.price || prod.pricing.selling };
      }
      return p;
    })
  );

  const record = await MedicalHistoryModel.create({
    ...input,
    treatments,
    prescriptions,
    doctorId: new mongoose.Types.ObjectId(doctorId),
  });
  return record.toObject() as any;
}

export async function updateMedicalHistory(id: string, input: MedicalHistoryUpdateRequest) {
  const record = await MedicalHistoryModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });
  return record as any;
}

export async function deleteMedicalHistory(id: string) {
  const record = await MedicalHistoryModel.findByIdAndDelete(id).lean();
  if (!record) throw Object.assign(new Error("Medical history not found"), { status: 404 });
  return record as any;
}

export async function getMedicalHistorySummary(petId: string) {
  const records = await MedicalHistoryModel.find({ petId })
    .populate("doctorId", "name")
    .sort({ visitDate: -1 })
    .limit(5)
    .lean();
  const totalVisits = await MedicalHistoryModel.countDocuments({ petId });
  return { records: records as any, totalVisits };
}
