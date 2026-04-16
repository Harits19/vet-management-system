import { Router } from "express";
import { createProduct, getProducts } from "../controllers/product-controller";

export const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.post("/", createProduct);
