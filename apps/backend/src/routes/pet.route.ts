import { Router } from "express";
import { getAll, getOne, create, update, remove, getByCustomer, distinct } from "../controllers/pet.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/distinct", distinct);
router.get("/by-customer/:customerId", getByCustomer);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
