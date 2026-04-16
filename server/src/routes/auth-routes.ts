import { Router } from "express";
import { login, logout, me } from "../controllers/auth-controller";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", me);
authRouter.post("/logout", logout);
