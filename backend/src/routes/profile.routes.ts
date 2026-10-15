import { Router } from "express";
import {
    getAllProfiles,
    getProfileByUserId,
    updateProfile,
} from "../controllers/profile.controller.js";
import { requireAuth, requireSelfOrRole } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ROL } from "../constants/roles.js";

export const profileRouter = Router();

profileRouter.get("/profiles", requireAuth, requireRole(ROL.ADMIN), getAllProfiles);
profileRouter.get(
    "/profile/:userId",
    requireAuth,
    requireSelfOrRole(ROL.ADMIN, "userId"),
    getProfileByUserId,
);
profileRouter.put(
    "/profile/:userId",
    requireAuth,
    requireSelfOrRole(ROL.ADMIN, "userId"),
    updateProfile,
);
