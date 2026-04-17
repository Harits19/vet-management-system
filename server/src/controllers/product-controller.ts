import { NextFunction, Request, Response } from "express";
import {
  createProductSchema,
  ProductDB,
  ProductRequest,
  ProductResponse,
  ProductsResponse,
} from "@/types";
import { productService } from "../services/product-service";
import { paginationQuerySchema } from "@/types/pagination";

class ProductController {
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = paginationQuerySchema.parse(req.query);

      const result = await productService.getAll(query);

      const response: ProductsResponse = {
        success: true,
        message: "Produk berhasil diambil.",
        data: result.data,
        pagination: result.pagination,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request<unknown, unknown, ProductRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = createProductSchema.parse(req.body);
      const product = await ProductDB.create(body);

      const response: ProductResponse = {
        success: true,
        message: `Produk ${product.name} berhasil dibuat.`,
        data: product,
      };

      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
