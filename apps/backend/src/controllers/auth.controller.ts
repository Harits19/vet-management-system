import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendResponse } from "src/services/response.service";
import { getCookieOptions } from "../config/auth.config.js";
import { authLoginSchema, cookieSchema } from "../../../shared/types/auth.type";

export const login = async (req: Request, res: Response) => {
  const { email, password } = authLoginSchema.parse(req.body);

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

export const saveCookie = async (req: Request, res: Response) => {
  const cookie = cookieSchema.parse(req.body);
  await authService.saveCookie(cookie);
  sendResponse(res, {
    success: true,
    data: undefined,
  })
}

export const getCookie = async (req: Request, res: Response) => {
  const cookie = await authService.getCookie();
  sendResponse(res, {
    success: true,
    data: cookie,
  })
}


export const authController = {
  login, logout, me, saveCookie, getCookie,
}