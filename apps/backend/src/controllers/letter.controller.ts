import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  listLetters,
  getLetter,
  createLetter,
  updateLetter,
  deleteLetter,
} from "../services/letter.service.js";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await listLetters({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      letterType: req.query.letterType as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json({
      success: true, data: result.data,
      meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getLetter(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await createLetter({ ...req.body, doctorId: req.user!.userId });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await updateLetter(req.params.id as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteLetter(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}
