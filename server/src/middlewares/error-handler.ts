import { NextFunction, Request, Response } from "express";

class ErrorMiddleware {
  handle = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.";

    const normalized = message.toLowerCase();

    const statusCode =
      normalized.includes("unauthorized") ||
      normalized.includes("email atau password salah")
        ? 401
        : 400;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  };

  notFoundHandler = (_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      message: "Route tidak ditemukan.",
    });
  };
}

// singleton instance
export const errorMiddleware = new ErrorMiddleware();
