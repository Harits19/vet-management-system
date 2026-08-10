import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  attendanceConfig,
  getStatus,
  registerFace,
  checkIn,
  listMine,
  listAll,
  generateQrPng,
  regenerateQrSecret,
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
        method: b.method,
        type: b.type,
        descriptor: b.descriptor,
        qrSecret: b.qrSecret,
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

export async function getQrHandler(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const png = await generateQrPng();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(png);
  } catch (err) {
    next(err);
  }
}

export async function regenerateQrHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await regenerateQrSecret(req.user!.userId) });
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
    res.json({
      success: true,
      data: await listAll({
        date: typeof req.query.date === "string" ? req.query.date : undefined,
        method: typeof req.query.method === "string" ? req.query.method : undefined,
        type: typeof req.query.type === "string" ? req.query.type : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      }),
    });
  } catch (err) {
    next(err);
  }
}
