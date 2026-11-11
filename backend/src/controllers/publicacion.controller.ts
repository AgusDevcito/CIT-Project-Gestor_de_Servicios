import type { Request, Response } from "express";
import { ROL } from "../constants/roles.js";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as publicacionService from "../services/publicacion.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const esPersonalCIT = (role?: string): boolean =>
    role === ROL.CIT || role === ROL.ADMIN;

export const getAllPublicaciones = asyncHandler(async (req: Request, res: Response) => {
    const includeDrafts = esPersonalCIT(req.user?.role);
    const data = await publicacionService.list({ includeDrafts });
    res.json({ count: data.length, data });
});

export const getPublicacionById = asyncHandler(async (req: Request, res: Response) => {
    const includeDrafts = esPersonalCIT(req.user?.role);
    const data = await publicacionService.getById(Number(req.params.id), { includeDrafts });
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

export const togglePublicacionEstado = asyncHandler(async (req: Request, res: Response) => {
    const publicado =
        typeof req.body?.publicado === "boolean" ? req.body.publicado : undefined;
    const data = await publicacionService.setEstadoPublicacion(
        Number(req.params.id),
        publicado,
    );
    res.json({
        msg: data.publicado ? "Publicacion publicada" : "Publicacion despublicada",
        data,
    });
});

export const deletePublicacion = asyncHandler(async (req: Request, res: Response) => {
    await publicacionService.remove(Number(req.params.id));
    res.json({ msg: "Publicacion eliminada" });
});
