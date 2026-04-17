import { Router } from "express";
import { productController } from "../controllers/product-controller";

class ProductRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", productController.get);
    this.router.post("/", productController.create);
  }
}

export const productRouter = new ProductRouter();
