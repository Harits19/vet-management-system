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

const singleFile = upload.single('file');

petClinic.post("/inventory", singleFile, syncController.syncInventory);
petClinic.post("/service", singleFile, syncController.syncService);


router.use("/pet-clinic", petClinic);

export default router;