
import { Request, Response } from 'express';
import { readExcelFile } from '../services/excel.service';
import { petClinicService } from '../services/pet-clinic.service';

class SyncController {
    async syncInventory(req: Request, res: Response) {
        const buffer = req.file?.buffer;
        if (!buffer) {
            return res.status(400).json({
                message: "File is required",
            });
        }


        const data = await petClinicService.syncInventory(buffer);

        return res.json({
            total: data.length,
            data,
        });
    }
}

export const syncController = new SyncController();