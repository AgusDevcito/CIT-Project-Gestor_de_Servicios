import { Router } from "express";
import {
    getAllProfiles,
    getProfileByUserId,
    updateProfile,
} from "../controllers/profile.controller.js";
import { validateProfileUpdate } from "../middlewares/profile.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireSelfOnly } from "../middlewares/profileAccess.middleware.js";

import { ROL } from "../constants/roles.js";

export const profileRouter = Router();
profileRouter.get("/profiles", requireAuth, requireRole(ROL.ADMIN), getAllProfiles);
profileRouter.get(
    "/profile/:userId",
    requireAuth,
    requireSelfOnly,
    getProfileByUserId,
);
profileRouter.put(
    "/profile/:userId",
    requireAuth,
    requireSelfOnly,
    validateProfileUpdate,
    updateProfile,
);
