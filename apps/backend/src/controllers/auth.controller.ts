import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendResponse } from "src/services/response.service";
import { userLoginSchema } from "src/models/user.model";
import { getCookieOptions } from "../config/auth.config.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = userLoginSchema.parse(req.body);

  const data = await authService.login(email, password);

  res.cookie("token", data.token, getCookieOptions());

  sendResponse(res, {
    success: true,
    data,
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", getCookieOptions());

  sendResponse(res, { success: true, data: undefined });
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  const user = await authService.getCurrentUser(token);

  sendResponse(res, {
    success: true,
    data: user,
  });
};
