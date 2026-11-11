import { citActivationRouter } from "../controllers/citActivation.controller.js";
import { Router } from "express";

export const citActivationRoutes = Router();

citActivationRoutes.use("/activate", citActivationRouter);
