import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  createShopTransaction,
  createVetTransaction,
  createVetTransactionFromMedicalHistory,
  listTransactions,
  getTransaction,
  deleteTransaction,
  getDashboardSummary,
  getDoctorDashboard,
} from "../services/transaction.service.js";
import { transactionFilterSchema, shopCreateSchema, transactionCreateSchema } from "@vet/shared";

// ──────────────────────────────────────────
// Shop (Penjualan)
// ──────────────────────────────────────────
export async function createShop(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = shopCreateSchema.parse(req.body);
    const data = await createShopTransaction(input, req.user!.userId, req.user!.username);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────
// Vet
// ──────────────────────────────────────────
export async function createVet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = transactionCreateSchema.parse({ ...req.body, type: "vet" });
    const data = await createVetTransaction(input, req.user!.userId, req.user!.username);
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
    const data = await createVetTransactionFromMedicalHistory(
      req.params.medicalHistoryId as string, paidAmount, paymentMethod,
      req.user!.userId, req.user!.username
    );
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────
// Shared
// ──────────────────────────────────────────
export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = transactionFilterSchema.parse(req.query);
    const result = await listTransactions(filter);
    res.json({
      success: true, data: result.data,
      meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) },
    });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getTransaction(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteTransaction(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────
export async function dashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDashboardSummary();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function doctorDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDoctorDashboard();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
