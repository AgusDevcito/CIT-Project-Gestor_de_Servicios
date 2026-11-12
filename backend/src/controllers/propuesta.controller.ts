import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as propuestaService from "../services/propuesta.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const uploadDir = path.resolve("uploads");

export const crearPropuesta = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const nueva = await propuestaService.create(
        req.body ?? {},
        user.id,
        req.file ?? null,
    );
    res.status(201).json({
        ok: true,
        msg: "Propuesta recibida exitosamente. El equipo del CIT evaluará la solicitud.",
        data: nueva,
    });
});

export const obtenerPropuestas = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const estado =
        typeof req.query.estado === "string" ? req.query.estado : undefined;
    const propuestas = await propuestaService.list(user, estado);
    res.status(200).json({ ok: true, total: propuestas.length, data: propuestas });
});

export const obtenerPendientesCIT = obtenerPropuestas;

export const obtenerPropuestaPorId = asyncHandler(
    async (req: Request, res: Response) => {
        const propuesta = await propuestaService.getById(Number(req.params.id));
        res.status(200).json({ ok: true, data: propuesta });
    },
);

export const descargarDocumentoPropuesta = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const safeFilename = path.basename(String(req.params.filename ?? ""));
        if (!safeFilename) {
            res.status(400).json({ msg: "Nombre de archivo inválido." });
            return;
        }

        const puedeAcceder = await propuestaService.canAccessDocumento(
            safeFilename,
            user,
        );
        if (!puedeAcceder) {
            res.status(403).json({
                msg: "No tienes permisos para acceder a este documento.",
            });
            return;
        }

        const resolvedPath = path.resolve(uploadDir, safeFilename);
        if (!resolvedPath.startsWith(uploadDir) || !fs.existsSync(resolvedPath)) {
            res.status(404).json({ msg: "El documento solicitado no existe." });
            return;
        }

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.sendFile(resolvedPath);
    },
);

export const tomarPropuestaEnRevision = asyncHandler(
    async (req: Request, res: Response) => {
        const user = getAuthUser(req);
        const propuesta = await propuestaService.tomarEnRevision(
            Number(req.params.id),
            user.id,
        );
        res.status(200).json({
            ok: true,
            msg: "La propuesta fue tomada para revisión.",
            data: propuesta,
        });
    },
);

export const dictaminarPropuestaCIT = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const {
        decision,
        justificacion,
        servicio_nombre,
        servicio_description,
        servicio_precio,
        servicio_img,
    } = req.body ?? {};
    const propuesta = await propuestaService.dictate(
        Number(req.params.id),
        decision,
        justificacion,
        user.id,
        {
            servicio_nombre,
            servicio_description,
            servicio_precio,
            servicio_img,
        },
    );
    res.status(200).json({
        ok: true,
        msg: `Propuesta evaluada exitosamente como ${decision}.`,
        data: propuesta,
    });
});

export const eliminarPropuesta = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const data = await propuestaService.remove(Number(req.params.id), user);
    res.status(200).json({
        ok: true,
        msg: `Propuesta "${data.titulo}" eliminada correctamente.`,
        data,
    });
});
