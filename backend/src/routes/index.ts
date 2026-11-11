import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { catalogosRouter } from "./catalogos.routes.js";
import { profileRouter } from "./profile.routes.js";
import { propuestasRouter } from "./propuestas.routes.js";
import { publicacionesRouter } from "./publicaciones.routes.js";
import { serviciosRouter } from "./servicios.routes.js";
import { citApplicationsRouter } from "./citApplications.routes.js";
import { citActivationRoutes } from "./citActivation.routes.js";
import { solicitudesRouter } from "./solicitudes.routes.js";
import { userRouter } from "./user.routes.js";

export const routes = Router();

routes.use("/", authRouter);
routes.use("/", profileRouter);
routes.use("/", userRouter);
routes.use("/", propuestasRouter);
routes.use("/", publicacionesRouter);
routes.use("/", catalogosRouter);
routes.use("/", citApplicationsRouter);
routes.use("/", citActivationRoutes);
routes.use("/", solicitudesRouter);
