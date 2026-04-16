import { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const message =
    error instanceof Error ? error.message : "Terjadi kesalahan pada server.";

  return res.status(400).json({
    success: false,
    message,
  });
}
