import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProductsByCode, getDistinctProductValues } from "../services/product.service.js";
import { productCreateSchema, productUpdateSchema, productFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = productFilterSchema.parse(req.query);
    const result = await listProducts(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getProduct(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = productCreateSchema.parse(req.body);
    const data = await createProduct(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = productUpdateSchema.parse(req.body);
    const data = await updateProduct(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteProduct(req.params.id as string);
    res.json({ success: true, data: null, message: "Deactivated" });
  } catch (err) { next(err); }
}

export async function searchByCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string | undefined;
    if (!code) { res.json({ success: true, data: [] }); return; }
    const data = await searchProductsByCode(code);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function distinct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const field = req.query.field as string;
    const productType = req.query.productType as string | undefined;
    const data = await getDistinctProductValues(field, productType);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
