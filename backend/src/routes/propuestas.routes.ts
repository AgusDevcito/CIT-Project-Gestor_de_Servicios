import { Router } from "express";
import {
    crearPropuesta,
    dictaminarPropuestaCIT,
    obtenerPendientesCIT,
} from "../controllers/propuesta.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT, requireUser } from "../middlewares/role.middleware.js";

export const propuestasRouter = Router();

propuestasRouter.get("/propuestas", requireAuth, requireCIT, obtenerPendientesCIT);
propuestasRouter.post("/propuesta/crear", requireAuth, requireUser, crearPropuesta);
propuestasRouter.post(
    "/propuestas/dictaminar/:id",
    requireAuth,
    requireCIT,
    dictaminarPropuestaCIT,
);
