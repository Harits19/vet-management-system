import {
  ICustomer,
} from "../../../shared/types/customer.type";
import { Request, Response } from "express";
import { buildSearchQuery, paginate } from "src/services/pagination.service";
import { customerListFilterSchema, CustomerModel } from "src/models/customer.model";
import { sendResponse } from "src/services/response.service";

const get = async (req: Request, res: Response) => {
  const query = customerListFilterSchema.parse(req.query);


  const result = await paginate({
    query,
    model: CustomerModel,
    searchKeys: ['name', 'whatsapp', 'address'],
  });

  return sendResponse(res, {
    success: true,
    data: result.data,
    meta: result.meta,
  });
};

export default {
  get,
};
