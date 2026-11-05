import { Router, Request, Response } from "express";
import * as profileService from "../services/profile.service.js";
import { validateProfileUpdate } from "../middlewares/profile.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireSelfOnly } from "../middlewares/profileAccess.middleware.js";
import { ROL } from "../constants/roles.js";

export const profileRouter = Router();

// Admin list all profiles
profileRouter.get("/profiles", requireAuth, requireRole(ROL.ADMIN), async (req: Request, res: Response) => {
  const data = await profileService.list();
  res.json({ count: data.length, data });
});

// Get own profile – authentication and self‑only (inline check)
profileRouter.get("/profile/:userId", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const requestedId = Number(req.params.userId);
  console.log('GET check start', { userId: user?.id, requestedId });
  console.log('GET auth fail values', { userId: user?.id, requestedId });
  if (user && user.role === ROL.ADMIN) {
    // admin can access any profile
    const data = await profileService.getByUserId(requestedId);
    return res.json({ data });
  }
  if (!user || user.id !== requestedId) {
    return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
  }
  const data = await profileService.getByUserId(requestedId);
  res.json({ data });
});

// Update own profile – authentication, self‑only and validation
profileRouter.put(
  "/profile/:userId",
  requireAuth,
  requireSelfOnly,
  validateProfileUpdate,
    // @ts-ignore
  async (req, res) => {
    console.log('PUT profile handler', req.params, req.body);
    // Only allow whitelisted fields to be updated
    const allowed = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      avatar_url: req.body.avatar_url,
    };
    const data = await profileService.update(Number(req.params.userId), allowed);
    res.json({ msg: "Perfil actualizado", data });
  },
);


