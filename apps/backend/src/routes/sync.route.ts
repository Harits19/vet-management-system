import { Router } from "express";
import multer from "multer";
import { sync } from "../controllers/sync.controller.js";

const router = Router();
const petClinic = Router();

const upload = multer({
  storage: multer.memoryStorage(), // Simpan file di memory
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const singleFile = upload.single("file");

petClinic.post("/inventory", singleFile, sync("inventory"));
petClinic.post("/service", singleFile, sync("service"));
petClinic.post("/patient", singleFile, sync("patient"));
petClinic.post(
  "/medical-history",
  singleFile,
  sync("medicalHistory"),
);

router.use("/pet-clinic", petClinic);

export default router;
