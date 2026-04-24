import { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware";
import { getProducts, importProducts, postProduct } from "src/controllers/product.controller";
import multer from "multer";

const productRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

productRouter.get("/", authMiddleware, getProducts);
productRouter.post("/", authMiddleware, postProduct);

productRouter.post("/import", upload.single("file"), importProducts);


export default productRouter;
