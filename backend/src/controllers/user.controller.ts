import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const data = await userService.create(req.body ?? {});
    res.status(201).json({ msg: "Usuario creado exitosamente", data });
});

export const getallUsers = asyncHandler(async (_req: Request, res: Response) => {
    const data = await userService.list();
    res.json({ count: data.length, data });
});

export const getUserbyID = asyncHandler(async (req: Request, res: Response) => {
    const data = await userService.getById(Number(req.params.id));
    res.json({ data });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const data = await userService.update(Number(req.params.id), req.body ?? {});
    res.json({ msg: "Se actualizaron los datos del usuario", data });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const data = await userService.remove(Number(req.params.id));
    res.json({ msg: "usuario eliminado", data });
});
