import type { Request, Response, NextFunction } from "express";
import {
  syncInventory,
  syncMedicalHistory,
  syncPatient,
  syncService,
} from "../services/pet-clinic.service.js";

type SyncType = "inventory" | "patient" | "service" | "medicalHistory";

const syncConfig: Record<SyncType, (file: Buffer) => Promise<unknown[]>> = {
  inventory: syncInventory,
  service: syncService,
  patient: syncPatient,
  medicalHistory: syncMedicalHistory,
};

export function sync(syncType: SyncType) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = req.file?.buffer;
      if (!buffer) {
        res.status(400).json({ message: "File is required" });
        return;
      }

      const data = await syncConfig[syncType](buffer);

      res.json({ data, meta: { total: data.length } });
    } catch (error) {
      next(error);
    }
  };
}
