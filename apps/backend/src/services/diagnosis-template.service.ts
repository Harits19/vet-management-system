import { DiagnosisTemplateModel, ServiceModel, ProductModel } from "../models/index.js";
import type { DiagnosisTemplateCreateRequest, DiagnosisTemplateUpdateRequest, DiagnosisTemplateFilter } from "@vet/shared";

// ──────────────────────────────────────────
// Resolve item template dari master by productId
// (aturan item 27: nama & harga di-GET dari master, bukan snapshot template)
// Item yang productId-nya tidak ditemukan di master di-exclude (produk terhapus/nonaktif).
// ──────────────────────────────────────────
async function resolveItems(items: any[] = []): Promise<any[]> {
  if (items.length === 0) return [];

  const ids = [...new Set(items.map((i: any) => i.productId).filter(Boolean))];
  const [services, products] = await Promise.all([
    ServiceModel.find({ _id: { $in: ids } }).select("name price").lean(),
    ProductModel.find({ _id: { $in: ids } }).select("product.name pricing.selling").lean(),
  ]);

  const master = new Map<string, { name: string; price: number }>();
  for (const s of services as any[]) master.set(String(s._id), { name: s.name, price: s.price ?? 0 });
  for (const p of products as any[]) {
    master.set(String(p._id), { name: p.product?.name ?? "", price: p.pricing?.selling ?? 0 });
  }

  return items
    .map((it: any) => {
      const m = master.get(String(it.productId));
      if (!m) return null;
      return { ...it, name: m.name, price: m.price };
    })
    .filter(Boolean);
}

async function resolveTemplate(tpl: any) {
  const [treatments, prescriptions, goods] = await Promise.all([
    resolveItems(tpl.items?.treatments),
    resolveItems(tpl.items?.prescriptions),
    resolveItems(tpl.items?.goods),
  ]);
  return { ...tpl, items: { treatments, prescriptions, goods } };
}

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

  const resolved = await Promise.all(data.map(resolveTemplate));
  return { data: resolved as any, total, page, limit };
}

export async function getDiagnosisTemplate(id: string) {
  const tpl = await DiagnosisTemplateModel.findById(id).lean();
  if (!tpl) throw Object.assign(new Error("Diagnosis tidak ditemukan"), { status: 404 });
  return (await resolveTemplate(tpl)) as any;
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
