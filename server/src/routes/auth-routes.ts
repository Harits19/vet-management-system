import { Router } from "express";
import { authController } from "../controllers/auth-controller";

class AuthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/login", authController.login);
    this.router.get("/me", authController.me);
    this.router.post("/logout", authController.logout);
  }
}

// export instance
export const authRouter = new AuthRouter();
