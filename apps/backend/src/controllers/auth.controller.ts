import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

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
