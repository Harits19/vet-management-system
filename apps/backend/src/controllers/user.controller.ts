import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { listUsers, getUser, createUser, updateUser, deleteUser } from "../services/user.service.js";
import { userCreateSchema, userUpdateSchema, userFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = userFilterSchema.parse(req.query);
    const result = await listUsers(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getUser(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = userCreateSchema.parse(req.body);
    const data = await createUser(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = userUpdateSchema.parse(req.body);
    const data = await updateUser(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.user!.userId) {
      throw Object.assign(new Error("Tidak bisa menonaktifkan akun sendiri"), { status: 400 });
    }
    const data = await deleteUser(req.params.id as string);
    res.json({ success: true, data, message: "Deactivated" });
  } catch (err) { next(err); }
}
