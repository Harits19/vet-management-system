import { Router } from "express";
import multer from "multer";
import { syncController } from "../controllers/sync.controller.js";

const router = Router();
const petClinic = Router();

const upload = multer({
  storage: multer.memoryStorage(), // Simpan file di memory
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const singleFile = upload.single("file");

petClinic.post("/inventory", singleFile, syncController.sync("inventory"));
petClinic.post("/service", singleFile, syncController.sync("service"));
petClinic.post("/patient", singleFile, syncController.sync("patient"));
petClinic.post(
  "/medical-history",
  singleFile,
  syncController.sync("medicalHistory"),
);

router.use("/pet-clinic", petClinic);

export default router;
