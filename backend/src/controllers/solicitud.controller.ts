import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as solicitudService from "../services/solicitud.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const uploadDir = path.resolve("uploads");

export const getSolicitudes = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.list(user);
    res.json({ count: data.length, data });
});

export const createSolicitud = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.create(req.body?.servicio_id, user.id, {
        beneficiario_nombre: req.body?.beneficiario_nombre,
        beneficiario_dni_cuit: req.body?.beneficiario_dni_cuit,
        beneficiario_localidad: req.body?.beneficiario_localidad,
    });
    res.status(201).json({ data });
});

export const updateSolicitudEstado = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await solicitudService.updateEstado(
            Number(req.params.id),
            req.body?.estado_id ?? req.body?.estado,
            req.body?.observaciones_cit,
        );
        res.json({
            msg: "Estado de la solicitud actualizado correctamente.",
            data,
        });
    },
);

export const subirResultadoSolicitud = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await solicitudService.adjuntarResultado(
            Number(req.params.id),
            {
                observaciones:
                    req.body?.resultado_observaciones ??
                    req.body?.observaciones_cit ??
                    req.body?.observaciones,
                resultado_url: req.body?.resultado_archivo_url,
                resultado_nombre: req.body?.resultado_nombre,
                finalizar: req.body?.finalizar,
            },
            req.file ?? null,
        );
        res.status(200).json({
            msg: "Resultado técnico adjuntado y entregado digitalmente al solicitante.",
            data,
        });
    },
);

export const descargarResultadoSolicitud = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const solicitud = await solicitudService.getById(Number(req.params.id));

        if (
            user.role !== "admin" &&
            user.role !== "cit" &&
            solicitud.user_id !== user.id
        ) {
            res.status(403).json({
                msg: "No tienes permisos para descargar el resultado de esta solicitud.",
            });
            return;
        }

        if (!solicitud.resultado_archivo_url) {
            res.status(404).json({
                msg: "Esta solicitud aún no cuenta con un informe de resultado adjunto.",
            });
            return;
        }

        const safeFilename = path.basename(solicitud.resultado_archivo_url);
        const resolvedPath = path.resolve(uploadDir, safeFilename);

        if (!resolvedPath.startsWith(uploadDir) || !fs.existsSync(resolvedPath)) {
            res.status(404).json({
                msg: "El archivo del informe solicitado no se encuentra disponible en el servidor.",
            });
            return;
        }

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.download(
            resolvedPath,
            solicitud.resultado_nombre || safeFilename,
        );
    },
);

export const cancelarSolicitud = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.cancelar(Number(req.params.id), user);
    res.json({
        msg: "La solicitud fue cancelada correctamente.",
        data,
    });
});

export const deleteSolicitud = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await solicitudService.remove(Number(req.params.id), user);
    res.json({
        msg: "Solicitud eliminada correctamente.",
        data,
    });
});
