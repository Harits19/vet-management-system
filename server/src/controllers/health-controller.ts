import { Request, Response } from "express";

class HealthController {
  get = (_req: Request, res: Response) => {
    return res.json({
      success: true,
      message: "API is healthy.",
      data: {
        service: "vet-management-system-api",
        timestamp: new Date().toISOString(),
      },
    });
  };
}

// singleton instance
export const healthController = new HealthController();
