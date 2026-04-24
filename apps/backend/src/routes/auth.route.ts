import express from "express";
import * as authController from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authMiddleware, authController.me);
export default authRouter;
