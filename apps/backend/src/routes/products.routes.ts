import { Router } from "express";
import { ApiResponse } from "../../../shared/types/api";
import { Product } from "../../../shared/types/product";
import { ProductModel } from "src/models/product.model";

const router = Router();

router.get("/", async (_request, response) => {
  const products = await ProductModel.find().sort({ createdAt: -1 }).exec();

  response.json({
    success: true,
    data: products,
  } satisfies ApiResponse<Product[]>);
});

export default router;
