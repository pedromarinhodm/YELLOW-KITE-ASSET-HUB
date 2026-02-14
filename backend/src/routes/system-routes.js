import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/health", async (_req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from("employees").select("id", { count: "exact", head: true });
    if (error) throw error;

    res.json({
      status: "ok",
      service: "yellow-kite-backend",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
