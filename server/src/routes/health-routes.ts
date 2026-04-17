import { Router } from "express";
import { healthController } from "../controllers/health-controller";

class HealthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", healthController.get);
  }
}

// export instance
export const healthRouter = new HealthRouter();
