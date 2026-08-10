import { Router } from "express";
import { createShop, createVet, getAll, getOne, remove, pay } from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/shop", createShop);
router.post("/vet", createVet);
router.post("/:id/pay", authorize("superadmin", "cashier", "doctor"), pay);
router.delete("/:id", authorize("superadmin", "doctor"), remove);

export default router;
