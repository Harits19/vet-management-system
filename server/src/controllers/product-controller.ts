import { NextFunction, Request, Response } from "express";
import {
  ProductInput,
  ProductResponse,
  ProductsResponse,
} from "@/shared/types";
import { productService } from "../services/product-service";

class ProductController {
  get = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await productService.getAll();

      const response: ProductsResponse = {
        success: true,
        message: "Produk berhasil diambil.",
        data: products,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request<unknown, unknown, ProductInput>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const product = await productService.create(req.body);

      const response: ProductResponse = {
        success: true,
        message: `Produk ${product.nama} berhasil dibuat.`,
        data: product,
      };

      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
