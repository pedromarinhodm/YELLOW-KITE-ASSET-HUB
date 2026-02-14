import { Router } from "express";
import { allocateEquipments, listAllocations, returnAllocation } from "../services/allocations-service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const employeeId = req.query.employeeId;

    const data = await listAllocations({ activeOnly, employeeId });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { employee_id, equipment_id, equipment_ids, allocated_at, notes, type, return_deadline } = req.body;

    const normalizedEquipmentIds = Array.isArray(equipment_ids)
      ? equipment_ids
      : equipment_id
        ? [equipment_id]
        : [];

    if (!employee_id || normalizedEquipmentIds.length === 0) {
      return res.status(400).json({ message: "Campos obrigatorios: employee_id e equipamento(s)" });
    }

    const data = await allocateEquipments({
      employee_id,
      equipment_ids: normalizedEquipmentIds,
      allocated_at,
      notes,
      type,
      return_deadline,
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/return", async (req, res, next) => {
  try {
    const { notes, returned_at, destination } = req.body;
    const data = await returnAllocation(req.params.id, { notes, returned_at, destination });

    if (!data) return res.status(404).json({ message: "Alocacao nao encontrada" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
