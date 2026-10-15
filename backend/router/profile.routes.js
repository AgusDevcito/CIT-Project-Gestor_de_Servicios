import { Router } from "express";
import {
    getAllProfiles,
    getProfileByUserId,
    updateProfile,
} from "../controllers/profile.controllers.js";
import { requireAuth, requireSelfOrRole } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/propuestas.middleware.js";

export const profileRouter = Router();

// Las operaciones de perfiles requieren una cuenta autenticada.
profileRouter.get("/profiles", requireAuth, requireRole("admin"), getAllProfiles);
profileRouter.get("/profile/:userId", requireAuth, requireSelfOrRole("admin"), getProfileByUserId);
profileRouter.put("/profile/:userId", requireAuth, requireSelfOrRole("admin"), updateProfile);