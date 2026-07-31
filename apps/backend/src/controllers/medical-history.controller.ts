import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  listMedicalHistories,
  getMedicalHistory,
  createMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  getMedicalHistorySummary,
  listDistinctDiagnoses,
} from "../services/medical-history.service.js";
import { medicalHistoryCreateSchema, medicalHistoryUpdateSchema, medicalHistoryFilterSchema } from "@vet/shared";
import { UserModel } from "../models/index.js";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = medicalHistoryFilterSchema.parse(req.query);
    const result = await listMedicalHistories(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getMedicalHistory(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = medicalHistoryCreateSchema.parse(req.body);
    const user = req.user!;
    let doctorName = user.username;
    if (user.userId) {
      const u = await UserModel.findById(user.userId).select("name").lean();
      if (u?.name) doctorName = u.name;
    }
    const data = await createMedicalHistory(input, user.userId, doctorName);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = medicalHistoryUpdateSchema.parse(req.body);
    const data = await updateMedicalHistory(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteMedicalHistory(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function getByPet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getMedicalHistorySummary(req.params.petId as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getDiagnoses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const data = await listDistinctDiagnoses(search);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
