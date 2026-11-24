import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as notificacionService from "../services/notificacion.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotificaciones = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const soloNoLeidas =
            req.query.soloNoLeidas === "true" || req.query.soloNoLeidas === "1";
        const limit = req.query.limit ? Number(req.query.limit) : undefined;

        const result = await notificacionService.listarPorUsuario(user.id, {
            soloNoLeidas,
            limit,
        });

        res.status(200).json({
            ok: true,
            unreadCount: result.unreadCount,
            total: result.total,
            data: result.data,
        });
    },
);

export const marcarNotificacionLeida = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const data = await notificacionService.marcarLeida(
            Number(req.params.id),
            user.id,
        );
        res.status(200).json({
            ok: true,
            msg: "Notificación marcada como leída.",
            data,
        });
    },
);

export const marcarTodasNotificacionesLeidas = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const result = await notificacionService.marcarTodasLeidas(user.id);
        res.status(200).json({
            ok: true,
            msg: "Todas las notificaciones fueron marcadas como leídas.",
            ...result,
        });
    },
);

export const getPreferenciasNotificacion = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const data = await notificacionService.obtenerPreferencias(user.id);
        res.status(200).json({ ok: true, data });
    },
);

export const updatePreferenciasNotificacion = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const data = await notificacionService.actualizarPreferencias(
            user.id,
            req.body ?? {},
        );
        res.status(200).json({
            ok: true,
            msg: "Preferencias de notificaciones actualizadas correctamente.",
            data,
        });
    },
);

export const crearAnuncioPlataforma = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await notificacionService.emitirAnuncioPlataforma({
            titulo: req.body?.titulo,
            mensaje: req.body?.mensaje,
            enlace: req.body?.enlace,
        });
        res.status(201).json({
            ok: true,
            msg: "Anuncio de actualización de plataforma enviado exitosamente.",
            ...result,
        });
    },
);
