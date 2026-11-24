import { Router } from "express";
import { getResumenMetricas } from "../controllers/metricas.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

export const metricasRouter = Router();

metricasRouter.get("/metricas/resumen", optionalAuth, getResumenMetricas);
