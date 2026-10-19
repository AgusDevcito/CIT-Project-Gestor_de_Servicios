import { Router } from "express";
import { createServicio, getServicios } from "../controllers/servicio.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT } from "../middlewares/role.middleware.js";

export const serviciosRouter = Router();

serviciosRouter.get("/servicios", requireAuth, getServicios);
serviciosRouter.post("/servicios", requireAuth, requireCIT, createServicio);
