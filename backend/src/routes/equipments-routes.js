import { Router } from "express";
import {
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  listEquipments,
  updateEquipment,
} from "../services/equipments-service.js";
import { isCoordinator, requireAuth, requireRole } from "../middlewares/auth-middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "coordinator"));

router.get("/", async (req, res, next) => {
  try {
    const data = await listEquipments({
      status: req.query.status,
      classification: req.query.classification,
      category: req.query.category,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const data = await getEquipmentById(req.params.id);
    if (!data) return res.status(404).json({ message: "Equipamento nao encontrado" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (isCoordinator(req.auth)) {
      return res.status(403).json({ message: "Somente admin pode cadastrar equipamento" });
    }

    const { name, category, classification, serial_number, purchase_value, purchase_date, status, image_url } = req.body;

    if (!name || !category || !classification || !serial_number || !purchase_value || !purchase_date) {
      return res.status(400).json({
        message: "Campos obrigatorios: name, category, classification, serial_number, purchase_value, purchase_date",
      });
    }

    const data = await createEquipment({
      name,
      category,
      classification,
      serial_number,
      purchase_value,
      purchase_date,
      status,
      image_url,
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["name", "category", "classification", "serial_number", "purchase_value", "purchase_date", "status", "image_url"];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const data = await updateEquipment(req.params.id, payload);
    if (!data) return res.status(404).json({ message: "Equipamento nao encontrado" });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (isCoordinator(req.auth)) {
      return res.status(403).json({ message: "Somente admin pode remover equipamento" });
    }
    await deleteEquipment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
