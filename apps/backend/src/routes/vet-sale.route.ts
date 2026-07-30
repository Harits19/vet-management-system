import { Router } from "express";
import { create, createFromMedicalHistory, getAll, getOne, remove, doctorDashboard } from "../controllers/vet-sale.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.post("/from-medical-history/:medicalHistoryId", createFromMedicalHistory);
router.delete("/:id", authorize("superadmin"), remove);

export default router;
