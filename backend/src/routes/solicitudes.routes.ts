import { Router } from "express";
import {
    cancelarSolicitud,
    createSolicitud,
    deleteSolicitud,
    descargarResultadoSolicitud,
    getSolicitudes,
    subirResultadoSolicitud,
    updateSolicitudEstado,
} from "../controllers/solicitud.controller.js";
import { uploadDocument } from "../helpers/upload.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole, requireUser } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const solicitudesRouter = Router();

solicitudesRouter.get("/solicitudes", requireAuth, getSolicitudes);
solicitudesRouter.post("/solicitudes", requireAuth, requireUser, createSolicitud);
solicitudesRouter.patch("/solicitudes/:id/cancelar", requireAuth, cancelarSolicitud);
solicitudesRouter.delete("/solicitudes/:id", requireAuth, deleteSolicitud);
solicitudesRouter.patch(
    "/solicitudes/:id/estado",
    requireAuth,
    requireRole(ROL.ADMIN, ROL.CIT),
    updateSolicitudEstado,
);
solicitudesRouter.post(
    "/solicitudes/:id/resultado",
    requireAuth,
    requireRole(ROL.ADMIN, ROL.CIT),
    uploadDocument.single("resultado"),
    subirResultadoSolicitud,
);
solicitudesRouter.patch(
    "/solicitudes/:id/resultado",
    requireAuth,
    requireRole(ROL.ADMIN, ROL.CIT),
    uploadDocument.single("resultado"),
    subirResultadoSolicitud,
);
solicitudesRouter.get(
    "/solicitudes/:id/resultado",
    requireAuth,
    descargarResultadoSolicitud,
);
