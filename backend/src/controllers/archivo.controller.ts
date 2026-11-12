import type { Request, Response } from "express";
import { ROL } from "../constants/roles.js";
import * as archivoService from "../services/archivo.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const esPersonalCIT = (role?: string): boolean =>
    role === ROL.CIT || role === ROL.ADMIN;

export const getArchivosByPublicacion = asyncHandler(
    async (req: Request, res: Response) => {
        const includeDrafts = esPersonalCIT(req.user?.role);
        const data = await archivoService.listByPublicacion(
            Number(req.params.publicacionId),
            { includeDrafts },
        );
        res.json({ count: data.length, data });
    },
);

export const createArchivo = asyncHandler(async (req: Request, res: Response) => {
    const data = await archivoService.create(
        Number(req.params.publicacionId),
        req.body ?? {},
    );
    res.status(201).json({ msg: "Archivo agregado", data });
});

export const deleteArchivo = asyncHandler(async (req: Request, res: Response) => {
    await archivoService.remove(Number(req.params.id));
    res.json({ msg: "Archivo eliminado" });
});
