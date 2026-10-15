import { Router } from "express";
import { createCatalogItem, getCatalog } from "../controllers/catalogos.controllers.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/propuestas.middleware.js";

export const catalogosRouter = Router();

catalogosRouter.get("/sectores", requireAuth, getCatalog("sectores"));
catalogosRouter.get("/estados", requireAuth, getCatalog("estados"));
catalogosRouter.post("/sectores", requireAuth, requireRole("admin"), createCatalogItem("sectores"));
catalogosRouter.post("/estados", requireAuth, requireRole("admin"), createCatalogItem("estados"));