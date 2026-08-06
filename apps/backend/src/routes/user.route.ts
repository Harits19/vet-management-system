import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);
// Manajemen akun login — hanya superadmin & admin
router.use(authorize("superadmin", "admin"));

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
