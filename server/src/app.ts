
import cors from "cors";
import express, { Application } from "express";
import { serverEnv } from "./config/env";
import { errorMiddleware } from "./middlewares/error-middleware";
import { apiRouter } from "./routes";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(
      cors({
        origin: serverEnv.appOrigin,
        credentials: true,
      }),
    );

    this.app.use(express.json());
  }

  private initializeRoutes() {
    this.app.use("/api", apiRouter.router);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware.notFoundHandler);
    this.app.use(errorMiddleware.handle);
  }
}

// export instance
export const appInstance = new App().app;
export default appInstance;
