import { Router } from "express";
import { createCatalogItem, getCatalog } from "../controllers/catalogo.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const catalogosRouter = Router();

catalogosRouter.get("/sectores", optionalAuth, getCatalog("sectores"));
catalogosRouter.get("/estados", optionalAuth, getCatalog("estados"));
catalogosRouter.post(
    "/sectores",
    requireAuth,
    requireRole(ROL.ADMIN),
    createCatalogItem("sectores"),
);
catalogosRouter.post(
    "/estados",
    requireAuth,
    requireRole(ROL.ADMIN),
    createCatalogItem("estados"),
);
