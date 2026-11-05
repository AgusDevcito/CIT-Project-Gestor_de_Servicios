import type { Request, RequestHandler } from "express";
import type { Rol } from "../constants/roles.js";
import { unauthorizedError } from "../errors/AppError.js";
import { verifyToken } from "../helpers/jwt.js";
import type { JwtPayload } from "../helpers/jwt.js";

import { getTokenFromRequest } from "../helpers/authHelper.js";

// Acceso tipado al usuario autenticado. Evita repetir "req.user!" en cada controlador.
export const getAuthUser = (req: Request): JwtPayload => {
    if (!req.user) {
        throw unauthorizedError("Se requiere un token de autenticación.");
    }
    return req.user;
};

export const requireAuth: RequestHandler = (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res
            .status(401)
            .json({ msg: "Se requiere un token de autenticación." });
    }

    try {
        req.user = verifyToken(token);
        console.log('Auth middleware set user', req.user);
        return next();
    } catch {
        return res.status(401).json({ msg: "El token es inválido o ha expirado." });
    }
};

export const requireSelfOrRole = (
    role: Rol,
    paramName = "userId",
): RequestHandler => (req, res, next) => {
    const user = req.user;
    const requestedUserId = Number(req.params[paramName]);

    if (user && (user.role === role || user.id === requestedUserId)) {
        return next();
    }

    return res
        .status(403)
        .json({ msg: "No tienes permisos para realizar esta acción." });
};
