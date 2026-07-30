import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  createVetSale,
  createVetSaleFromMedicalHistory,
  listVetSales,
  getVetSale,
  deleteVetSale,
  getDoctorDashboard,
} from "../services/vet-sale.service.js";
import { vetSaleCreateSchema, vetSaleFilterSchema } from "@vet/shared";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = vetSaleCreateSchema.parse(req.body);
    const data = await createVetSale(input, req.user!.userId, req.user!.username);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function createFromMedicalHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { paidAmount, paymentMethod } = req.body;
    if (!paidAmount || !paymentMethod) {
      res.status(400).json({ success: false, message: "paidAmount and paymentMethod required" });
      return;
    }
    const data = await createVetSaleFromMedicalHistory(
      req.params.medicalHistoryId as string,
      paidAmount,
      paymentMethod,
      req.user!.userId,
      req.user!.username
    );
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = vetSaleFilterSchema.parse(req.query);
    const result = await listVetSales(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getVetSale(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteVetSale(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function doctorDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDoctorDashboard();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
