import { Router } from "express";
import { login, logout, profile, register, forgotPassword, resetPassword, changePassword } from "../controllers/auth.controller.js";
import { uploadDocument } from "../helpers/upload.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", uploadDocument.single("document"), register);
authRouter.post("/login", login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/profile", requireAuth, profile);
authRouter.post("/forgot", forgotPassword);
authRouter.post("/reset", resetPassword);
authRouter.put("/change-password", requireAuth, changePassword);
