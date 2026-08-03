import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/diagnosis-template.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", authorize("admin", "superadmin", "doctor"), create);
router.put("/:id", authorize("admin", "superadmin", "doctor"), update);
router.delete("/:id", authorize("admin", "superadmin", "doctor"), remove);

export default router;
