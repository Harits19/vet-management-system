import { Router } from "express";
import { createShop, createVet, createFromMedicalHistory, getAll, getOne, remove } from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/shop", createShop);
router.post("/vet", createVet);
router.post("/vet/from-medical-history/:medicalHistoryId", createFromMedicalHistory);
router.delete("/:id", authorize("superadmin"), remove);

export default router;
