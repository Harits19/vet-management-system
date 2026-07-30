import { Router } from "express";
import { dashboard } from "../controllers/sale.controller.js";
import { doctorDashboard } from "../controllers/vet-sale.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/summary", dashboard);
router.get("/doctor", doctorDashboard);

export default router;
