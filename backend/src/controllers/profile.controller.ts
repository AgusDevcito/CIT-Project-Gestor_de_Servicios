import type { Request, Response } from "express";
import * as profileService from "../services/profile.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllProfiles = asyncHandler(async (_req: Request, res: Response) => {
    const data = await profileService.list();
    res.json({ count: data.length, data });
});

export const getProfileByUserId = asyncHandler(async (req: Request, res: Response) => {
    const data = await profileService.getByUserId(Number(req.params.userId));
    res.json({ data });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const data = await profileService.update(Number(req.params.userId), req.body ?? {});
    res.json({ msg: "Perfil actualizado", data });
});
