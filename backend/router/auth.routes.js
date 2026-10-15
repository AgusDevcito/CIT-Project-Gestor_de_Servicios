import { Router } from "express";
import { login, logout, profile, register } from "../controllers/auth.controllers.js";
import { uploadDocument } from "../helper/upload.js";
import { requireAuth } from "../middlewares/auth.middleware.js";


export const authRouter = Router();

authRouter.post("/register", uploadDocument.single("document"), register);
authRouter.post("/login",login);
authRouter.get("/profile",requireAuth,profile);
authRouter.post("/logout", requireAuth, logout)