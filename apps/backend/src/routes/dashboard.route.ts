import { Router } from "express";
import { dashboard, doctorDashboard } from "../controllers/transaction.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/summary", dashboard);
router.get("/doctor", doctorDashboard);

export default router;
