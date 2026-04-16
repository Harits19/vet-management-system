import { Router } from "express";
import { authRouter } from "./auth-routes";
import { healthRouter } from "./health-routes";
import { productRouter } from "./product-routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/products", productRouter);
