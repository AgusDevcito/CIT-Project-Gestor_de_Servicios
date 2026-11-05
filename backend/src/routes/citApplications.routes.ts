import { Router } from "express";
import { citApplicationRouter } from "../controllers/citApplication.controller.js";

export const citApplicationsRouter = Router();

// All routes are prefixed by /api/cit-applications in main index (via mounting)
citApplicationsRouter.use("/cit-applications", citApplicationRouter);
