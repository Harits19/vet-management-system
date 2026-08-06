import type { Response, NextFunction } from "express";
import { loginUser, getMe, saveDoctorSignature, updateProfile } from "../services/auth.service.js";
import type { AuthRequest } from "../config/auth.js";
import { getCookieOptions } from "../config/auth.js";
import { authLoginSchema, authUpdateProfileSchema } from "@vet/shared";

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = authLoginSchema.parse(req.body);
    const result = await loginUser(input.username, input.password);
    res.cookie("token", result.token, getCookieOptions());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: AuthRequest, res: Response) {
  res.clearCookie("token");
  res.json({ success: true, data: null, message: "Logged out" });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getMe(req.user!.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = authUpdateProfileSchema.parse(req.body);
    const data = await updateProfile(req.user!.userId, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function saveSignature(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const doctorSignature: unknown = req.body?.doctorSignature;
    if (typeof doctorSignature !== "string" || !doctorSignature.trim()) {
      throw Object.assign(new Error("Tanda tangan tidak valid"), { status: 400 });
    }
    const data = await saveDoctorSignature(req.user!.userId, doctorSignature);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
