import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as publicacionService from "../services/publicacion.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllPublicaciones = asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicacionService.list();
    res.json({ count: data.length, data });
});

export const getPublicacionById = asyncHandler(async (req: Request, res: Response) => {
    const data = await publicacionService.getById(Number(req.params.id));
    res.json({ data });
});

export const createPublicacion = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await publicacionService.create(req.body ?? {}, user.id);
    res.status(201).json({ msg: "Publicacion creada", data });
});

export const updatePublicacion = asyncHandler(async (req: Request, res: Response) => {
    const data = await publicacionService.update(Number(req.params.id), req.body ?? {});
    res.json({ msg: "Publicacion actualizada", data });
});

export const deletePublicacion = asyncHandler(async (req: Request, res: Response) => {
    await publicacionService.remove(Number(req.params.id));
    res.json({ msg: "Publicacion eliminada" });
});
