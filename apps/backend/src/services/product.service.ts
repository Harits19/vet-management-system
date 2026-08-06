import { ProductModel } from "../models/index.js";
import type { ProductCreateRequest, ProductUpdateRequest, ProductFilter } from "@vet/shared";

export async function listProducts(filter: ProductFilter) {
  const { page, limit, search, productType, goodType, category, sortBy, order } = filter;
  const query: any = { isActive: true };
  if (productType) query.productType = productType;
  if (goodType) query.goodType = goodType;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { "product.name": { $regex: search, $options: "i" } },
      { "product.code": { $regex: search, $options: "i" } },
    ];
  }
  const total = await ProductModel.countDocuments(query);
  const sortField = sortBy === "product.name" || sortBy === "pricing.selling" || sortBy === "inventory.quantity" || sortBy === "createdAt" ? sortBy : "createdAt";
  const data = await ProductModel.find(query)
    .sort({ [sortField]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getProduct(id: string) {
  const product = await ProductModel.findById(id).lean();
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  return product as any;
}

export async function createProduct(input: ProductCreateRequest) {
  // Normalisasi: non-obat wajib punya goodType (default petshop);
  // stok tidak diisi = 0 (biar muncul di low stock, bukan field hilang)
  const payload: any = { ...input };
  if (payload.productType === "good" && !payload.goodType) payload.goodType = "petshop";
  const qty = payload.inventory?.quantity;
  if (qty === undefined || qty === null || qty === "") {
    payload.inventory = { ...(payload.inventory || {}), quantity: 0 };
  }
  const product = await ProductModel.create(payload);
  return product.toObject() as any;
}

export async function updateProduct(id: string, input: ProductUpdateRequest) {
  const product = await ProductModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  return product as any;
}

export async function deleteProduct(id: string) {
  const product = await ProductModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  return product as any;
}

export async function searchProductsByCode(code: string) {
  return ProductModel.find({ "product.code": { $regex: code, $options: "i" }, isActive: true }).limit(10).lean();
}

// Nilai unik untuk autocomplete (category, subcategory, unit, product.name, dll)
export async function getDistinctProductValues(field: string, productType?: string, goodType?: string) {
  const allowed = new Set(["category", "subcategory", "unit", "product.name", "productType"]);
  if (!allowed.has(field)) throw Object.assign(new Error("Field tidak didukung"), { status: 400 });

  const query: any = { isActive: true };
  if (productType) query.productType = productType;
  if (goodType) query.goodType = goodType;

  const values = await ProductModel.distinct(field, query);
  return values.filter((v: unknown) => typeof v === "string" && (v as string).trim() !== "");
}
