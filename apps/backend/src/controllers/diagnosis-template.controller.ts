import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  listDiagnosisTemplates,
  getDiagnosisTemplate,
  createDiagnosisTemplate,
  updateDiagnosisTemplate,
  deleteDiagnosisTemplate,
} from "../services/diagnosis-template.service.js";
import { diagnosisTemplateCreateSchema, diagnosisTemplateUpdateSchema, diagnosisTemplateFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = diagnosisTemplateFilterSchema.parse(req.query);
    const result = await listDiagnosisTemplates(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getDiagnosisTemplate(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = diagnosisTemplateCreateSchema.parse(req.body);
    const data = await createDiagnosisTemplate(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = diagnosisTemplateUpdateSchema.parse(req.body);
    const data = await updateDiagnosisTemplate(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteDiagnosisTemplate(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}
