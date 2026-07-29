import { Router } from "express";
import { create, getAll, getOne, remove } from "../controllers/sale.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", authorize("cashier", "admin", "superadmin"), create);
router.delete("/:id", authorize("superadmin"), remove);

export default router;
