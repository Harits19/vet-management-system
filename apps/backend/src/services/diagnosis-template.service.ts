import { DiagnosisTemplateModel } from "../models/index.js";
import type { DiagnosisTemplateCreateRequest, DiagnosisTemplateUpdateRequest, DiagnosisTemplateFilter } from "@vet/shared";

export async function listDiagnosisTemplates(filter: DiagnosisTemplateFilter) {
  const { page, limit, search } = filter;
  const query: any = {};
  if (search) query.name = { $regex: search, $options: "i" };
  const total = await DiagnosisTemplateModel.countDocuments(query);
  const data = await DiagnosisTemplateModel.find(query)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getDiagnosisTemplate(id: string) {
  const tpl = await DiagnosisTemplateModel.findById(id).lean();
  if (!tpl) throw Object.assign(new Error("Diagnosis tidak ditemukan"), { status: 404 });
  return tpl as any;
}

export async function createDiagnosisTemplate(input: DiagnosisTemplateCreateRequest) {
  const tpl = await DiagnosisTemplateModel.create(input);
  return tpl.toObject() as any;
}

export async function updateDiagnosisTemplate(id: string, input: DiagnosisTemplateUpdateRequest) {
  const tpl = await DiagnosisTemplateModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!tpl) throw Object.assign(new Error("Diagnosis tidak ditemukan"), { status: 404 });
  return tpl as any;
}

export async function deleteDiagnosisTemplate(id: string) {
  const tpl = await DiagnosisTemplateModel.findByIdAndDelete(id).lean();
  if (!tpl) throw Object.assign(new Error("Diagnosis tidak ditemukan"), { status: 404 });
  return tpl as any;
}
