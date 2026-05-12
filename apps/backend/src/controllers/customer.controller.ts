import {
  customerFilterSchema,
  ICustomer,
} from "../../../shared/types/customer.type";
import { Request, Response } from "express";
import { buildSearchQuery, paginate } from "src/services/pagination.service";
import { CustomerModel } from "src/models/customer.model";
import { sendResponse } from "src/services/response.service";

const get = async (req: Request, res: Response) => {
  const parsed = customerFilterSchema.parse(req.query);

  const { page, limit, search, sortBy, order } = parsed;

  let query: any = {};

  Object.assign(query, buildSearchQuery<ICustomer>(search, ["name"]));

  const result = await paginate(CustomerModel, query, {
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
  get,
};
