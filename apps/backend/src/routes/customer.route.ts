import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import customerController from "src/controllers/customer.controller.js";

const customerRouter = express.Router();

customerRouter.get("/", authMiddleware, customerController.get);

export default customerRouter;
