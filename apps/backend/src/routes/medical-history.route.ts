import { Router } from "express";
import { getAll, getOne, create, update, remove, getByPet, getDiagnoses } from "../controllers/medical-history.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/diagnoses", getDiagnoses);
router.get("/by-pet/:petId", getByPet);
router.get("/:id", getOne);
router.post("/", authorize("doctor", "superadmin"), create);
router.put("/:id", authorize("doctor", "superadmin"), update);
router.delete("/:id", authorize("doctor", "superadmin"), remove);

export default router;
