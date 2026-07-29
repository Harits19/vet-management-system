import { Router } from "express";
import { getAll, getServices, getPhysical, getOne, create, update, remove, searchByCode } from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/services", getServices);
router.get("/physical", getPhysical);
router.get("/search", searchByCode);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
