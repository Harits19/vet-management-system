import { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware";
import { getProducts } from "src/controllers/product.controller";

const productRouter = Router();

productRouter.get("/", authMiddleware, getProducts);

export default productRouter;
