import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import saleController from "src/controllers/sale.controller.js";
import { vetSaleController } from "src/controllers/vet.sale.controller.js";

const saleRouter = express.Router();

saleRouter.post("/sync", authMiddleware, saleController.sync);
saleRouter.get("/", authMiddleware, vetSaleController.get);
saleRouter.post("/", authMiddleware, vetSaleController.create);

saleRouter.get("/custom", saleController.custom);



export default saleRouter;
