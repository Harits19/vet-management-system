import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/service.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
