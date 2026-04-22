import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendResponse } from "src/services/response.service";
import { userLoginSchema } from "src/models/user.model";

export const login = async (req: Request, res: Response) => {
  const { email, password } = userLoginSchema.parse(req.body);

  const data = await authService.login(email, password);

  res.cookie("token", data.token, {
    httpOnly: true,
    secure: true, // production
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24, // 1 hari
  });

  sendResponse(res, {
    success: true,
    data,
  });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true di production
  });

  sendResponse(res, { success: true, data: undefined });
};
