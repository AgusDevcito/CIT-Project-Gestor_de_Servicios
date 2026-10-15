import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as solicitudService from "../services/solicitud.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSolicitudes = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.list(user);
    res.json({ count: data.length, data });
});

export const createSolicitud = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.create(req.body?.servicio_id, user.id);
    res.status(201).json({ data });
});

export const updateSolicitudEstado = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await solicitudService.updateEstado(
            Number(req.params.id),
            req.body?.estado_id ?? req.body?.estado,
        );
        res.json({ data });
    },
);
