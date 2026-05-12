import { Request, Response } from "express";
import { sendResponse } from "src/services/response.service";
import { getCookieOptions } from "../config/auth.config.js";
import { authLoginSchema, cookieSchema } from "../../../shared/types/auth.type";
import authService from "src/services/auth.service.js";

export const login = async (req: Request, res: Response) => {
  const { username, password } = authLoginSchema.parse(req.body);

  const data = await authService.login(username, password);

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

export const getToken = (req: Request) => {

  return req.cookies?.token;
}

export const getCurrentUser = async (req: Request) => {
  const token = getToken(req);
  const user = await authService.getCurrentUser(token);

  return user;
}


export const me = async (req: Request, res: Response) => {
  const user = await getCurrentUser(req)

  sendResponse(res, {
    success: true,
    data: user,
  });
};

export const saveAplikasirCookie = async (req: Request, res: Response) => {
  const cookie = cookieSchema.parse(req.body);
  await authService.saveCookie(cookie);
  sendResponse(res, {
    success: true,
    data: undefined,
  })
}

export const getAplikasirCookie = async (req: Request, res: Response) => {
  const cookie = await authService.getCookie();
  sendResponse(res, {
    success: true,
    data: cookie,
  })
}

export const createUser = async (req: Request, res: Response) => {

}


export const authController = {
  login, logout, me, saveAplikasirCookie, getAplikasirCookie,
}