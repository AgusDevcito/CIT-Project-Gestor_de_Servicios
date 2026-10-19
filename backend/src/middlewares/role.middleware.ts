import type { RequestHandler } from "express";
import { ROL } from "../constants/roles.js";
import type { Rol } from "../constants/roles.js";

export const requireRole = (...allowedRoles: Rol[]): RequestHandler =>
    (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ msg: "No tienes permisos para realizar esta acción." });
        }

        return next();
    };

export const requireCIT = requireRole(ROL.CIT);
export const requireUser = requireRole(ROL.USER);
