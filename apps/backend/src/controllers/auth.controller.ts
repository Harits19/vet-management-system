import type { Response, NextFunction } from "express";
import { loginUser } from "../services/auth.service.js";
import type { AuthRequest } from "../config/auth.js";
import { getCookieOptions } from "../config/auth.js";
import { authLoginSchema } from "@vet/shared";

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

export async function me(req: AuthRequest, res: Response) {
  res.json({ success: true, data: req.user });
}
