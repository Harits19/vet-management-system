import { Router } from "express";
import { login, logout, me, updateMe, saveSignature } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/me", authenticate, updateMe);
router.put("/me/signature", authenticate, saveSignature);

export default router;
