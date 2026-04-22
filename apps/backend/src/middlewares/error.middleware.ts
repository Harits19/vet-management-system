import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err); // optional log

  // 🔴 ZOD ERROR
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.flatten(),
    });
  }

  // 🔴 MONGOOSE DUPLICATE
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value",
    });
  }

  // 🔴 JWT ERROR
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // 🔴 DEFAULT
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
