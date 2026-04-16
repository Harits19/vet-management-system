import { NextFunction, Request, Response } from "express";
import { ProductInput, ProductResponse, ProductsResponse } from "@/shared/types";
import { productService } from "../services/product-service";

export function getProducts(_req: Request, res: Response) {
  const response: ProductsResponse = {
    success: true,
    message: "Produk berhasil diambil.",
    data: productService.getAll(),
  };

  return res.json(response);
}

export function createProduct(
  req: Request<unknown, unknown, ProductInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = productService.create(req.body);

    const response: ProductResponse = {
      success: true,
      message: `Produk ${product.nama} berhasil dibuat.`,
      data: product,
    };

    return res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
}
