import { Router } from "express";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import {
  getConfig,
  getStatusHandler,
  registerFaceHandler,
  checkInHandler,
  listMineHandler,
  listAllHandler,
  getQrHandler,
} from "../controllers/attendance.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

// Superadmin dikecualikan dari absensi — tidak perlu absen (tapi boleh lihat laporan /list)
function excludeSuperadmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role === "superadmin") {
    res.status(403).json({ success: false, message: "Superadmin tidak perlu absen" });
    return;
  }
  next();
}

router.get("/config", getConfig);
router.get("/status", excludeSuperadmin, getStatusHandler);
router.get("/me", excludeSuperadmin, listMineHandler);
router.post("/register-face", excludeSuperadmin, registerFaceHandler);
router.post("/check-in", excludeSuperadmin, checkInHandler);
router.get("/list", authorize("admin", "superadmin"), listAllHandler);
// QR statis untuk dipajang/dicetak di tempat absen — hanya admin/superadmin
router.get("/qr", authorize("admin", "superadmin"), getQrHandler);

export default router;
