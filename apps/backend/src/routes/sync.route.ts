import { Router } from "express";
import multer from "multer";
import { sync } from "../controllers/sync.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// HARDENING (insiden 2026-08-10): endpoint sync upload publik TANPA auth = lubang RCE —
// siapa pun bisa kirim file. Sync produksi dijalankan via script tsx langsung (bukan HTTP),
// jadi aman dikunci superadmin-only.
router.use(authenticate);
router.use(authorize("superadmin"));

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
