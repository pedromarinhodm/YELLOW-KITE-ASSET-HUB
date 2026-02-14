import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listDepartments,
  listEmployees,
  updateEmployee,
} from "../services/employees-service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const data = await listEmployees({ includeInactive });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/departments", async (_req, res, next) => {
  try {
    const data = await listDepartments();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const data = await getEmployeeById(req.params.id);
    if (!data) return res.status(404).json({ message: "Colaborador nao encontrado" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, role, email, department, status } = req.body;

    if (!name || !role || !email || !department) {
      return res.status(400).json({ message: "Campos obrigatorios: name, role, email, department" });
    }

    const data = await createEmployee({ name, role, email, department, status });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["name", "role", "email", "department", "status"];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const data = await updateEmployee(req.params.id, payload);
    if (!data) return res.status(404).json({ message: "Colaborador nao encontrado" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
