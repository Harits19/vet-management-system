import { Router } from "express";
import multer from "multer";
import { syncController } from "../controllers/sync.controller";

const router = Router();
const petClinic = Router();

const upload = multer({
    storage: multer.memoryStorage(), // Simpan file di memory
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

petClinic.post("/inventory", upload.single('file'), syncController.syncInventory);

router.use("/pet-clinic", petClinic);

export default router;