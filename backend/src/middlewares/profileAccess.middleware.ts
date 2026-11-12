import type { RequestHandler } from "express";

export const requireSelfOnly: RequestHandler = (req, res, next) => {
    const user = req.user;
    const requestedId = Number(req.params.userId);
    if (user && user.id === requestedId) {
        return next();
    }
    return res.status(403).json({ msg: "No tienes permisos para realizar esta acción." });
};
