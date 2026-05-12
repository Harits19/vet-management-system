import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authController } from "src/controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.post("/cookie", authController.saveAplikasirCookie);
authRouter.get("/cookie", authController.getAplikasirCookie);


export default authRouter;
