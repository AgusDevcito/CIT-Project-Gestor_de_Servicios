import type { Request, Response } from "express";
import * as profileService from "../services/profile.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllProfiles = asyncHandler(async (_req: Request, res: Response) => {
    const data = await profileService.list();
    res.json({ count: data.length, data });
});

export const getProfileByUserId = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const requestedId = Number(req.params.userId);
    if (!user || user.id !== requestedId) {
        return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
    }
    const data = await profileService.getByUserId(requestedId);
    res.json({ data });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user || user.id !== Number(req.params.userId)) {
        return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
    }
    const data = await profileService.update(Number(req.params.userId), req.body ?? {});
    res.json({ msg: "Perfil actualizado", data });
});
