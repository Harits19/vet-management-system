import { Router } from "express";
import { dashboard } from "../controllers/sale.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/summary", dashboard);

export default router;
