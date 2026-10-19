import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as servicioService from "../services/servicio.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getServicios = asyncHandler(async (_req: Request, res: Response) => {
    const data = await servicioService.list();
    res.json({ count: data.length, data });
});

export const createServicio = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await servicioService.create(req.body ?? {}, user.id);
    res.status(201).json({ data });
});
