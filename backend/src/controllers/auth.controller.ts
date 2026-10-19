import type { Request, Response } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register({ ...req.body, file: req.file ?? null });
    res.status(200).json({ msg: "Usuario Registrado", document_url: result.documentUrl });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    const result = await authService.login(username, password);
    res.status(200).json({ msg: "Usuario Logueado", token: result.token });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.json({ msg: "Logout exitoso" });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    res.status(200).json(await authService.getMyProfile(user.id));
});
