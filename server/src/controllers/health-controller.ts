import { Request, Response } from "express";

export function getHealth(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "API is healthy.",
    data: {
      service: "vet-management-system-api",
      timestamp: new Date().toISOString(),
    },
  });
}
