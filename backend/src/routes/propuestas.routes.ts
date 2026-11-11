import { Router } from "express";
import {
    crearPropuesta,
    descargarDocumentoPropuesta,
    dictaminarPropuestaCIT,
    obtenerPropuestaPorId,
    obtenerPropuestas,
    tomarPropuestaEnRevision,
} from "../controllers/propuesta.controller.js";
import { uploadDocument } from "../helpers/upload.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT, requireUser } from "../middlewares/role.middleware.js";

export const propuestasRouter = Router();

propuestasRouter.get("/propuestas", requireAuth, obtenerPropuestas);
propuestasRouter.get("/propuestas/:id", requireAuth, requireCIT, obtenerPropuestaPorId);
propuestasRouter.get("/uploads/:filename", requireAuth, descargarDocumentoPropuesta);

propuestasRouter.post(
    "/propuesta/crear",
    requireAuth,
    requireUser,
    uploadDocument.single("documento"),
    crearPropuesta,
);
propuestasRouter.post(
    "/propuestas",
    requireAuth,
    requireUser,
    uploadDocument.single("documento"),
    crearPropuesta,
);

propuestasRouter.patch(
    "/propuestas/:id/revision",
    requireAuth,
    requireCIT,
    tomarPropuestaEnRevision,
);
propuestasRouter.post(
    "/propuestas/dictaminar/:id",
    requireAuth,
    requireCIT,
    dictaminarPropuestaCIT,
);
propuestasRouter.patch(
    "/propuesta/:id/dictamen",
    requireAuth,
    requireCIT,
    dictaminarPropuestaCIT,
);
