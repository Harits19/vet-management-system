import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);
    res.cookie("token", data.token, {
      httpOnly: true,
      secure: true, // production
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
    });
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true di production
  });

  res.json({ success: true });
};
