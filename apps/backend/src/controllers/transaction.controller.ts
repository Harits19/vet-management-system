import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  createShopTransaction,
  createVetTransaction,
  listTransactions,
  getTransaction,
  deleteTransaction,
  payTransaction,
  getDashboardSummary,
  getDoctorDashboard,
} from "../services/transaction.service.js";
import { transactionFilterSchema, shopCreateSchema, transactionCreateSchema, transactionPaySchema } from "@vet/shared";

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
// Pay debt — bayar transaksi hutang/DP
// ──────────────────────────────────────────
export async function pay(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = transactionPaySchema.parse(req.body);
    const data = await payTransaction(req.params.id as string, input);
    res.json({ success: true, data, message: "Pembayaran berhasil" });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────
export async function dashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDashboardSummary({
      diagnosesPage: Number(req.query.diagnosesPage) || 1,
      customersPage: Number(req.query.customersPage) || 1,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function doctorDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDoctorDashboard();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
