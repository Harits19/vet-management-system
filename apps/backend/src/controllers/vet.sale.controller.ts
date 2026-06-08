import { Request, Response } from "express";
import { vetSaleCreateSchema, vetSaleFilterSchema } from "../../../shared/types/vet.sale.type";
import { getCurrentUser } from "./auth.controller";
import { sendResponse } from "src/services/response.service";
import { vetSaleService } from "src/services/vet.sale.service";
import { salesFilterSchema } from "../../../shared/types/sale.type";
import { buildSearchQuery, paginate } from "src/services/pagination.service";
import { VetSaleDB } from "src/models/vet.sale.model";


export class VetSaleController {


    async create(req: Request, res: Response) {
        const body = vetSaleCreateSchema.parse(req.body);
        const user = await getCurrentUser(req);
        const data = await vetSaleService.create({ sale: body, cashier: user, })
        return sendResponse(res, { success: true, data: data })
    }


    async get(req: Request, res: Response) {
        const parsed = vetSaleFilterSchema.parse(req.query);

        const { page, limit, search, sortBy, order } = parsed;

        let query: any = {};

        Object.assign(
            query,
            buildSearchQuery(search, ["customer.name", 'cashier.name']),
        );

        const result = await paginate(VetSaleDB, query, {
            page,
            limit,
            sortBy,
            order,
        });

        return sendResponse(res, {
            success: true,
            data: result.data,
            meta: result.meta,
        });
    };

}

export const vetSaleController = new VetSaleController();