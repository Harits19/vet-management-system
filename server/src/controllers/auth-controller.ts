import { NextFunction, Request, Response } from "express";
import { parse } from "cookie";
import { AuthResponse, LoginInput } from "@/shared/types";
import { authService } from "../services/auth-service";
import { serverEnv } from "../config/env";

class AuthController {
  // POST /login
  login = async (
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = req.body;

      if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email dan password wajib diisi.",
        });
      }

      const result = await authService.login(req.body);

      res.setHeader("Set-Cookie", result.cookie);

      const response: AuthResponse = {
        success: true,
        message: "Login berhasil.",
        data: {
          user: result.user,
        },
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // GET /me
  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookies = parse(req.headers.cookie || "");
      const token = cookies[serverEnv.cookieName];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const payload = await authService.verifyAccessToken(token);

      return res.json({
        success: true,
        message: "Session valid.",
        data: {
          user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /logout
  logout = (_req: Request, res: Response) => {
    res.setHeader("Set-Cookie", authService.clearAuthCookie());

    return res.json({
      success: true,
      message: "Logout berhasil.",
      data: null,
    });
  };
}

// singleton instance
export const authController = new AuthController();
