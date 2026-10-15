import { Router } from "express";
import { createCatalogItem, getCatalog } from "../controllers/catalogo.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const catalogosRouter = Router();

catalogosRouter.get("/sectores", requireAuth, getCatalog("sectores"));
catalogosRouter.get("/estados", requireAuth, getCatalog("estados"));
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
