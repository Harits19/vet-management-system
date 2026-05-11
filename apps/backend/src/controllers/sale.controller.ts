import { Request, Response } from "express";
import { sendResponse } from "src/services/response.service";
import { SaleModel } from "src/models/sale.model";
import { salesFilterSchema, syncSchema } from "../../../shared/types/sale.type";
import { buildSearchQuery, paginate } from "src/services/pagination.service";
import aplikasirService from "src/services/aplikasir.service";
import zod from 'zod'


export const sync = async (req: Request, res: Response) => {
  console.log('sync body', JSON.stringify(req.body))

  const body = syncSchema.parse(req.body);
  await aplikasirService.sync(body)

  sendResponse(res, {
    success: true,
    data: undefined,
  })
};


const get = async (req: Request, res: Response) => {
  const parsed = salesFilterSchema.parse(req.query);

  const { page, limit, search, sortBy, order } = parsed;

  // 🔍 base query
  let query: any = {};

  // 🔍 search
  Object.assign(
    query,
    buildSearchQuery(search, ["receiptNumber", "cashier", "customer"]),
  );

  const result = await paginate(SaleModel, query, {
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

export default {
  sync,
  get,
};
