import { Router } from "express";
import { crearPropuesta,obtenerPendientesCIT,dictaminarPropuestaCIT } from "../controllers/propuestas.controllers.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT, requireUser } from "../middlewares/propuestas.middleware.js";

export const propuestasRoute = Router()

propuestasRoute.get("/propuestas", requireAuth, requireCIT, obtenerPendientesCIT)
propuestasRoute.post("/propuesta/crear", requireAuth, requireUser, crearPropuesta)
propuestasRoute.post("/propuestas/dictaminar/:id", requireAuth, requireCIT, dictaminarPropuestaCIT)