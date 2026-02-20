import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listDepartments,
  listEmployees,
  updateEmployee,
} from "../services/employees-service.js";
import {
  ensureEmployeeDepartmentAccess,
  isCoordinator,
  requireAuth,
  requireRole,
} from "../middlewares/auth-middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "coordinator"));

const normalizeDepartment = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const department = isCoordinator(req.auth) ? req.auth.department : null;
    const data = await listEmployees({ includeInactive, department });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/departments", async (req, res, next) => {
  try {
    if (isCoordinator(req.auth)) {
      return res.json(req.auth.department ? [req.auth.department] : []);
    }
    const data = await listDepartments();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    await ensureEmployeeDepartmentAccess(req.auth, req.params.id);
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

    if (isCoordinator(req.auth) && normalizeDepartment(department) !== normalizeDepartment(req.auth.department)) {
      return res.status(403).json({ message: "Coordenador so pode criar colaboradores do proprio departamento" });
    }

    const data = await createEmployee({ name, role, email, department, status });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    await ensureEmployeeDepartmentAccess(req.auth, req.params.id);
    const allowed = ["name", "role", "email", "department", "status"];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

    if (
      isCoordinator(req.auth) &&
      payload.department &&
      normalizeDepartment(payload.department) !== normalizeDepartment(req.auth.department)
    ) {
      return res.status(403).json({ message: "Coordenador nao pode mover colaborador para outro departamento" });
    }

    const data = await updateEmployee(req.params.id, payload);
    if (!data) return res.status(404).json({ message: "Colaborador nao encontrado" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (isCoordinator(req.auth)) {
      return res.status(403).json({ message: "Somente admin pode remover colaborador" });
    }
    await deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
