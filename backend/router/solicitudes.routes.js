import { Router } from "express";
import { createSolicitud, getSolicitudes, updateSolicitudEstado } from "../controllers/solicitudes.controllers.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/propuestas.middleware.js";

export const solicitudesRouter = Router();
solicitudesRouter.get("/solicitudes", requireAuth, getSolicitudes);
solicitudesRouter.post("/solicitudes", requireAuth, createSolicitud);
solicitudesRouter.patch("/solicitudes/:id/estado", requireAuth, requireRole("admin", "cit"), updateSolicitudEstado);