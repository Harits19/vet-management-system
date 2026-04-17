import { Router } from "express";
import { authRouter } from "./auth-routes";
import { healthRouter } from "./health-routes";
import { productRouter } from "./product-routes";

class ApiRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use("/auth", authRouter.router);
    this.router.use("/health", healthRouter.router);
    this.router.use("/products", productRouter.router);
  }
}

// export instance
export const apiRouter = new ApiRouter();
