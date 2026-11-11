import { Router } from "express";
import {
    createPublicacion,
    deletePublicacion,
    getAllPublicaciones,
    getPublicacionById,
    togglePublicacionEstado,
    updatePublicacion,
} from "../controllers/publicacion.controller.js";
import {
    createArchivo,
    deleteArchivo,
    getArchivosByPublicacion,
} from "../controllers/archivo.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { requireCIT } from "../middlewares/role.middleware.js";

export const publicacionesRouter = Router();

// Lectura de publicaciones: público y usuarios normales ven únicamente las publicadas;
// el personal CIT y Admin ven también los borradores/despublicadas.
publicacionesRouter.get("/publicaciones", optionalAuth, getAllPublicaciones);
publicacionesRouter.get("/publicacion/:id", optionalAuth, getPublicacionById);
publicacionesRouter.get(
    "/publicacion/:publicacionId/archivos",
    optionalAuth,
    getArchivosByPublicacion,
);

// Administración de publicaciones: exclusivo para personal CIT y Admin.
publicacionesRouter.post("/publicacion/crear", requireAuth, requireCIT, createPublicacion);
publicacionesRouter.post("/publicacion", requireAuth, requireCIT, createPublicacion);
publicacionesRouter.put("/publicacion/:id", requireAuth, requireCIT, updatePublicacion);
publicacionesRouter.patch(
    "/publicacion/:id/estado",
    requireAuth,
    requireCIT,
    togglePublicacionEstado,
);
publicacionesRouter.delete("/publicacion/:id", requireAuth, requireCIT, deletePublicacion);
publicacionesRouter.post(
    "/publicacion/:publicacionId/archivos",
    requireAuth,
    requireCIT,
    createArchivo,
);
publicacionesRouter.delete("/archivo/:id", requireAuth, requireCIT, deleteArchivo);
