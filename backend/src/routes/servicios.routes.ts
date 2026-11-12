import { Router } from "express";
import {
    createResenaServicio,
    createServicio,
    deleteServicio,
    getServicioById,
    getServicios,
} from "../controllers/servicio.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT } from "../middlewares/role.middleware.js";

export const serviciosRouter = Router();

serviciosRouter.get("/servicios", optionalAuth, getServicios);
serviciosRouter.get("/servicios/:id", optionalAuth, getServicioById);
serviciosRouter.post("/servicios", requireAuth, requireCIT, createServicio);
serviciosRouter.delete("/servicios/:id", requireAuth, requireCIT, deleteServicio);
serviciosRouter.post("/servicios/:id/resenas", requireAuth, createResenaServicio);
