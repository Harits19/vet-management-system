import { ProductModel } from "src/models/product.model";
import { Request, Response } from "express";
import { sendResponse } from "src/services/response.service";
import {
  productSchema,
  productsFilterSchema,
} from "../../../shared/types/product.type";

export const getProducts = async (req: Request, res: Response) => {
  const parsed = productsFilterSchema.parse(req.query);

  const { page, limit, search, category, sortBy, order } = parsed;

  const skip = (page - 1) * limit;

  // 🧠 build query dinamis
  const query: any = {};

  // 🔍 SEARCH (name + barcode)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  // 🏷️ FILTER category
  if (category) {
    query.category = category;
  }

  // 🔃 SORT
  const sort: any = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  const [data, total] = await Promise.all([
    ProductModel.find(query).skip(skip).limit(limit).sort(sort).lean(),
    ProductModel.countDocuments(query),
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

export const postProduct = async (req: Request, res: Response) => {
  const body = productSchema.parse(req.body);
  const product = await ProductModel.create(body);

  return sendResponse(res, {
    success: true,
    data: product,
  });
};
