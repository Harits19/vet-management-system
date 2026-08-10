import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  attendanceConfig,
  getStatus,
  registerFace,
  checkIn,
  listMine,
  listAll,
} from "../services/attendance.service.js";

export function getConfig(_req: AuthRequest, res: Response) {
  res.json({ success: true, data: attendanceConfig() });
}

export async function getStatusHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await getStatus(req.user!.userId) });
  } catch (err) {
    next(err);
  }
}

export async function registerFaceHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await registerFace(req.user!.userId, req.body?.descriptor) });
  } catch (err) {
    next(err);
  }
}

export async function checkInHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const b = req.body ?? {};
    res.json({
      success: true,
      data: await checkIn(req.user!.userId, req.user!.role, {
        type: b.type,
        descriptor: b.descriptor,
        lat: b.lat,
        lng: b.lng,
        accuracy: b.accuracy,
        livenessPassed: b.livenessPassed,
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function listMineHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    res.json({ success: true, data: await listMine(req.user!.userId, date) });
  } catch (err) {
    next(err);
  }
}

export async function listAllHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    res.json({ success: true, data: await listAll(date) });
  } catch (err) {
    next(err);
  }
}
