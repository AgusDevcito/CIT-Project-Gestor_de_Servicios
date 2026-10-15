import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Rol } from "../constants/roles.js";
import { unauthorizedError } from "../errors/AppError.js";

export interface JwtPayload {
    id: number;
    email: string;
    role: Rol;
}

export interface TokenSubject {
    id: number;
    email: string;
    role: Rol;
}

export const signToken = (user: TokenSubject): string => {
    if (!env.jwtSecret) {
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
    );
};

export const verifyToken = (token: string): JwtPayload => {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded === "string") {
        throw unauthorizedError("El token es inválido o ha expirado.");
    }

    return {
        id: Number(decoded.id),
        email: String(decoded.email),
        role: decoded.role as Rol,
    };
};
