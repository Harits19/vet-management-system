import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { listServices, getService, createService, updateService, deleteService } from "../services/service.service.js";
import { serviceCreateSchema, serviceUpdateSchema, serviceFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = serviceFilterSchema.parse(req.query);
    const result = await listServices(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getService(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = serviceCreateSchema.parse(req.body);
    const data = await createService(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = serviceUpdateSchema.parse(req.body);
    const data = await updateService(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteService(req.params.id as string);
    res.json({ success: true, data: null, message: "Deactivated" });
  } catch (err) { next(err); }
}
