import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as propuestaService from "../services/propuesta.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const crearPropuesta = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const nueva = await propuestaService.create(req.body ?? {}, user.id);
    res.status(201).json({
        ok: true,
        msg: "Propuesta agropecuaria registrada exitosamente.",
        data: nueva,
    });
});

export const obtenerPendientesCIT = asyncHandler(async (_req: Request, res: Response) => {
    const pendientes = await propuestaService.listPending();
    res.status(200).json({ ok: true, total: pendientes.length, data: pendientes });
});

export const dictaminarPropuestaCIT = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { decision, justificacion } = req.body ?? {};
    const propuesta = await propuestaService.dictate(
        Number(req.params.id),
        decision,
        justificacion,
        user.id,
    );
    res.status(200).json({
        ok: true,
        msg: `Propuesta evaluada exitosamente como ${decision}.`,
        data: propuesta,
    });
});
