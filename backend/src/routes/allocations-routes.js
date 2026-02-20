import { Router } from "express";
import { allocateEquipments, listAllocations, returnAllocation, returnAllocationsBatch } from "../services/allocations-service.js";
import {
  ensureAllocationDepartmentAccess,
  ensureAllocationsDepartmentAccess,
  ensureEmployeeDepartmentAccess,
  isCoordinator,
  requireAuth,
  requireRole,
} from "../middlewares/auth-middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "coordinator"));

router.get("/", async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const employeeId = req.query.employeeId;
    const department = isCoordinator(req.auth) ? req.auth.department : null;

    if (isCoordinator(req.auth) && employeeId) {
      await ensureEmployeeDepartmentAccess(req.auth, employeeId);
    }

    const data = await listAllocations({ activeOnly, employeeId, department });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { employee_id, equipment_id, equipment_ids, allocated_at, notes, return_deadline, movement_type } = req.body;

    const normalizedEquipmentIds = Array.isArray(equipment_ids)
      ? equipment_ids
      : equipment_id
        ? [equipment_id]
        : [];

    if (!employee_id || normalizedEquipmentIds.length === 0) {
      return res.status(400).json({ message: "Campos obrigatorios: employee_id e equipamento(s)" });
    }

    await ensureEmployeeDepartmentAccess(req.auth, employee_id);

    const data = await allocateEquipments({
      employee_id,
      equipment_ids: normalizedEquipmentIds,
      allocated_at,
      notes,
      return_deadline,
      performed_by: req.auth.userId,
      performed_by_name: req.auth.name || req.auth.email || null,
      movement_type,
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/return", async (req, res, next) => {
  try {
    await ensureAllocationDepartmentAccess(req.auth, req.params.id);

    const { notes, returned_at, destination } = req.body;
    const data = await returnAllocation(req.params.id, {
      notes,
      returned_at,
      destination,
      returned_by: req.auth.userId,
      returned_by_name: req.auth.name || req.auth.email || null,
    });

    if (!data) return res.status(404).json({ message: "Alocacao nao encontrada" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/return-batch", async (req, res, next) => {
  try {
    const { allocation_ids, returned_at, notes_by_allocation, destinations_by_allocation } = req.body;

    if (!Array.isArray(allocation_ids) || allocation_ids.length === 0) {
      return res.status(400).json({ message: "Campo obrigatorio: allocation_ids (array nao vazio)" });
    }

    await ensureAllocationsDepartmentAccess(req.auth, allocation_ids);

    const data = await returnAllocationsBatch({
      allocation_ids,
      returned_at,
      notes_by_allocation,
      destinations_by_allocation,
      returned_by: req.auth.userId,
      returned_by_name: req.auth.name || req.auth.email || null,
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
