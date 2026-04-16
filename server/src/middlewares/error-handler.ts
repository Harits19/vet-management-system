import { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
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
}
