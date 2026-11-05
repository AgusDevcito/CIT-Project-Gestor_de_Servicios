import type { Request, Response, NextFunction } from "express";
import { getAuthUser } from "../middlewares/auth.middleware.js";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { env } from "../config/env.js";
export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.register({ ...req.body, file: (req as any).file ?? null });
    res.status(200).json({ msg: "Usuario Registrado", document_url: result.documentUrl });
});

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { username, password } = req.body ?? {};
    const result = await authService.login(username, password);
    // Set JWT as HttpOnly cookie
    res.cookie("token", result.token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
    res.status(200).json({ msg: "Usuario Logueado", token: result.token });
});

export const logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie("token");
    res.json({ msg: "Logout exitoso" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body ?? {};
  const result = await authService.forgotPassword(email);
  res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { token, newPassword } = req.body ?? {};
  const result = await authService.resetPassword(token, newPassword);
  res.status(200).json(result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const user = getAuthUser(req);
  const result = await authService.changePassword(user.id, currentPassword, newPassword);
  res.status(200).json(result);
});

    const user = getAuthUser(req);
    res.status(200).json(await authService.getMyProfile(user.id));
});
