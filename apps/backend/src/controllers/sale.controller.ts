import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { createSale, listSales, getSale, deleteSale, getDashboardSummary } from "../services/sale.service.js";
import { saleCreateSchema, saleFilterSchema } from "@vet/shared";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = saleCreateSchema.parse(req.body);
    const data = await createSale(input, req.user!.userId, req.user!.username);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = saleFilterSchema.parse(req.query);
    const result = await listSales(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getSale(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteSale(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function dashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDashboardSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
