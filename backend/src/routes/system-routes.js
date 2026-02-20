﻿import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/health", async (_req, res, next) => {
  try {
    console.log("Testing database connection...");
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Schema:", process.env.SUPABASE_DB_SCHEMA || "gestao_patrimonio");
    
    // Test connection with a simple query on the schema
    const { data, error, count } = await supabaseAdmin
      .from("employees")
      .select("*", { count: "exact", head: true });
    
    console.log("Query result:", { data, error, count });
    
    if (error) {
      console.error("Database query error:", error);
      // Try to get more details about the error
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      };
      throw new Error(`Database connection failed: ${JSON.stringify(errorDetails)}`);
    }

    res.json({
      status: "ok",
      service: "yellow-kite-backend",
      database: "connected",
      schema: process.env.SUPABASE_DB_SCHEMA || "gestao_patrimonio",
      employeeCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    next(error);
  }
});





export default router;
