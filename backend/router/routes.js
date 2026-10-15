import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { userRouter } from "./user.routes.js";
import { propuestasRoute } from "./propuestas.routes.js";
import { profileRouter } from "./profile.routes.js";
import { publicacionesRouter } from "./publicaciones.routes.js";
import { catalogosRouter } from "./catalogos.routes.js";
import { serviciosRouter } from "./servicios.routes.js";
import { solicitudesRouter } from "./solicitudes.routes.js";

export const routes =  Router();

routes.use("/",authRouter);
routes.use("/",userRouter);
routes.use("/", propuestasRoute)
routes.use("/", profileRouter)
routes.use("/", publicacionesRouter)
routes.use("/", catalogosRouter)
routes.use("/", serviciosRouter)
routes.use("/", solicitudesRouter)

