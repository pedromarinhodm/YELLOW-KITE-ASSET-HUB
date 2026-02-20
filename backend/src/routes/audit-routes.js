import { Router } from "express";
import { listAuditAllocations, listAuditCoordinators } from "../services/audit-service.js";
import { requireAuth, requireRole } from "../middlewares/auth-middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res, next) => {
  try {
    const data = await listAuditAllocations();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/coordinators", async (_req, res, next) => {
  try {
    const data = await listAuditCoordinators();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
