import { Request, Response } from "express";
import { vetSaleCreateSchema } from "../../../shared/types/vet.sale.type";
import { getCurrentUser } from "./auth.controller";
import { sendResponse } from "src/services/response.service";
import { vetSaleService } from "src/services/vet.sale.service";


export async function createVetSale(req: Request, res: Response) {
    const body = vetSaleCreateSchema.parse(req.body);
    const user = await getCurrentUser(req);
    const data = await vetSaleService.create({ sale: body, cashier: user, })
    return sendResponse(res, { success: true, data: data })
}