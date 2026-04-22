import { ProductModel } from "src/models/product.model";
import { Request, Response } from "express";
import { paginationQuerySchema } from "src/models/pagination.model";
import { sendResponse } from "src/services/response.service";

export const getProducts = async (req: Request, res: Response) => {
  const parsed = paginationQuerySchema.parse(req.query);

  const { page, limit } = parsed;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    ProductModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    ProductModel.countDocuments(),
  ]);

  return sendResponse(res, {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};
