import { Product, ProductModel } from "src/models/product.model";
import { Request, Response } from "express";
import { ApiResponse } from "../../../shared/types/api";

export const getProducts = async (req: Request, res: Response) => {
  const result = await ProductModel.find().lean<Product[]>();
  const response: ApiResponse<Product[]> = {
    success: true,
    data: result,
  };

  return res.json(response);
};
