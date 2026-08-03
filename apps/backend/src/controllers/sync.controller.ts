import type { Request, Response, NextFunction } from "express";
import { petClinicService } from "../services/pet-clinic.service.js";

class SyncController {
    async syncInventory(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = req.file?.buffer;
            if (!buffer) {
                res.status(400).json({ message: "File is required" });
                return;
            }

            const data = await petClinicService.syncInventory(buffer);

            res.json({ data, meta: { total: data.length } });
        } catch (error) {
            next(error);
        }
    }
}

export const syncController = new SyncController();
