import type { RequestHandler } from "express";
import { ROL } from "../constants/roles.js";
export const requireSelfOnly: RequestHandler = (req, res, next) => {
    const user = (req as any).user;
    const requestedId = Number(req.params.userId);
    console.log('requireSelfOnly check', { userId: user?.id, role: user?.role, requestedId });
    if (user && (user.role === ROL.USER || user.id === requestedId)) {
        return next();
    }
    return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
};
