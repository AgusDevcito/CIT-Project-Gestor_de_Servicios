import { Router } from "express";
import {
    createPublicacion,
    deletePublicacion,
    getAllPublicaciones,
    getPublicacionById,
    updatePublicacion,
} from "../controllers/publicaciones.controllers.js";
import {
    createArchivo,
    deleteArchivo,
    getArchivosByPublicacion,
} from "../controllers/archivos.controllers.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT } from "../middlewares/propuestas.middleware.js";

export const publicacionesRouter = Router();

// Todos los usuarios autenticados pueden leer publicaciones y sus archivos.
publicacionesRouter.get("/publicaciones", requireAuth, getAllPublicaciones);
publicacionesRouter.get("/publicacion/:id", requireAuth, getPublicacionById);
publicacionesRouter.get(
    "/publicacion/:publicacionId/archivos",
    requireAuth,
    getArchivosByPublicacion,
);

// Solo un trabajador CIT puede administrar el contenido tecnico.
publicacionesRouter.post(
    "/publicacion/crear",
    requireAuth,
    requireCIT,
    createPublicacion,
);
publicacionesRouter.put(
    "/publicacion/:id",
    requireAuth,
    requireCIT,
    updatePublicacion,
);
publicacionesRouter.delete(
    "/publicacion/:id",
    requireAuth,
    requireCIT,
    deletePublicacion,
);
publicacionesRouter.post(
    "/publicacion/:publicacionId/archivos",
    requireAuth,
    requireCIT,
    createArchivo,
);
publicacionesRouter.delete(
    "/archivo/:id",
    requireAuth,
    requireCIT,
    deleteArchivo,
);