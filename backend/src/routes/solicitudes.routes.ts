import { Router } from "express";
import {
    createSolicitud,
    deleteSolicitud,
    getSolicitudes,
    updateSolicitudEstado,
} from "../controllers/solicitud.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole, requireUser } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const solicitudesRouter = Router();

solicitudesRouter.get("/solicitudes", requireAuth, getSolicitudes);
solicitudesRouter.post("/solicitudes", requireAuth, requireUser, createSolicitud);
solicitudesRouter.delete("/solicitudes/:id", requireAuth, deleteSolicitud);
solicitudesRouter.patch(
    "/solicitudes/:id/estado",
    requireAuth,
    requireRole(ROL.ADMIN, ROL.CIT),
    updateSolicitudEstado,
);
