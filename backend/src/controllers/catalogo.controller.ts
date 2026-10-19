import type { Request, Response } from "express";
import type { CatalogoTipo } from "../repositories/catalog.repository.js";
import * as catalogoService from "../services/catalogo.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCatalog = (type: CatalogoTipo) =>
    asyncHandler(async (_req: Request, res: Response) => {
        const data = await catalogoService.list(type);
        res.json({ count: data.length, data });
    });

export const createCatalogItem = (type: CatalogoTipo) =>
    asyncHandler(async (req: Request, res: Response) => {
        const data = await catalogoService.create(type, req.body ?? {});
        res.status(201).json({ data });
    });
