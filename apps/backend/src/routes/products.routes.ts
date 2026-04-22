import { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware";
import { getProducts, postProduct } from "src/controllers/product.controller";

const productRouter = Router();

productRouter.get("/", authMiddleware, getProducts);
productRouter.post("/", authMiddleware, postProduct);


export default productRouter;
