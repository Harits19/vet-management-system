import { Request, Response } from "express";
import { sendResponse } from "src/services/response.service";
import { SaleDB } from "src/models/sale.model";
import { mapSaleItem, SaleCreateRequest, salesCreateSchema, salesFilterSchema, syncSchema } from "../../../shared/types/sale.type";
import { buildSearchQuery, paginate } from "src/services/pagination.service";
import aplikasirService from "src/services/aplikasir.service";
import zod from 'zod'
import authService from "src/services/auth.service";
import { getCurrentUser } from "./auth.controller";


export const sync = async (req: Request, res: Response) => {

  const body = syncSchema.parse(req.body ?? {});
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

  const result = await paginate(SaleDB, query, {
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

const custom = async (req: Request, res: Response) => {
  const result = await SaleDB.find({
    $or: [
      { items: { $exists: false } },
      { items: null },
      { "items.0": { $exists: false } }
    ]
  });

  console.log('Empty items', result.length);
  const cookie = await authService.getCookie()

  for (const item of result) {
    const id = item.externalId;
    if (!id) {
      console.log(`id undefined`);
      continue;
    }
    const detail = await aplikasirService.syncDetail({ id, cookie });

    item.items = detail.map(mapSaleItem);
    await item.save();
  }

  sendResponse(res, { data: result, success: true, })

}

const create = async (req: Request, res: Response) => {
  const body: SaleCreateRequest = salesCreateSchema.parse(req.body ?? {})
  const user = await getCurrentUser(req);
  sendResponse(res, { success: true, data: {} })

}

export default {
  sync,
  get,
  custom,
  create
};
