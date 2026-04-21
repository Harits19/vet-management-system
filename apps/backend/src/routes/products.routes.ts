import { Router } from "express";
import { ApiResponse } from "../../../shared/types/api";
import { Product } from "../../../shared/types/product";
import { ProductModel } from "src/models/product.model";

const productRouter = Router();

productRouter.get("/", async (_request, response) => {
  const products = await ProductModel.find().sort({ createdAt: -1 }).exec();

  response.json({
    success: true,
    data: products,
  } satisfies ApiResponse<Product[]>);
});

export default productRouter;
