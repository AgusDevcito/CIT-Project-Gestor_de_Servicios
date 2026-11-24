import type { Request, Response } from "express";
import * as metricasService from "../services/metricas.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getResumenMetricas = asyncHandler(
    async (_req: Request, res: Response) => {
        const data = await metricasService.obtenerResumenMetricas();
        res.status(200).json({ ok: true, data });
    },
);
