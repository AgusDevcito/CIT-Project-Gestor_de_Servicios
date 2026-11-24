import { Router } from "express";
import { ROL } from "../constants/roles.js";
import {
    crearAnuncioPlataforma,
    getNotificaciones,
    getPreferenciasNotificacion,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    updatePreferenciasNotificacion,
} from "../controllers/notificacion.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const notificacionesRouter = Router();

notificacionesRouter.get("/notificaciones", requireAuth, getNotificaciones);
notificacionesRouter.patch(
    "/notificaciones/leer-todas",
    requireAuth,
    marcarTodasNotificacionesLeidas,
);
notificacionesRouter.patch(
    "/notificaciones/:id/leer",
    requireAuth,
    marcarNotificacionLeida,
);
notificacionesRouter.get(
    "/notificaciones/preferencias",
    requireAuth,
    getPreferenciasNotificacion,
);
notificacionesRouter.put(
    "/notificaciones/preferencias",
    requireAuth,
    updatePreferenciasNotificacion,
);
notificacionesRouter.post(
    "/notificaciones/anuncio",
    requireAuth,
    requireRole(ROL.CIT, ROL.ADMIN),
    crearAnuncioPlataforma,
);
