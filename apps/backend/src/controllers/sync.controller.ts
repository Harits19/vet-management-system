import type { Request, Response, NextFunction } from "express";
import { petClinicService } from "../services/pet-clinic.service.js";

type SyncType = 'inventory' | 'patient' | 'service' | 'medicalHistory';
class SyncController {

    sync(syncType: SyncType) {
        const syncConfig: Record<SyncType, (file: Buffer) => Promise<unknown[]>> = {
            inventory: petClinicService.syncInventory,
            service: petClinicService.syncService,
            patient: petClinicService.syncPatient,
            medicalHistory: petClinicService.syncMedicalHistory,
        }

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
        }

    }
}

export const syncController = new SyncController();
