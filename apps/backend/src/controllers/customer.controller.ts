
import { Request, Response } from "express";
import { paginate } from "src/services/pagination.service";
import { customerListFilterSchema, CustomerModel } from "src/models/customer.model";
import { sendResponse } from "src/services/response.service";
import { customerCreateSchema } from "../../../shared/types/customer.type";

class CustomerController {
  async get(req: Request, res: Response) {
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

  async create(req: Request, res: Response) {
    const body = customerCreateSchema.parse(req.body);

    const data = await CustomerModel.create(body);
    
    return sendResponse(res, {
      success: true,
      data,
    });
  }
}

export const customerController = new CustomerController();
