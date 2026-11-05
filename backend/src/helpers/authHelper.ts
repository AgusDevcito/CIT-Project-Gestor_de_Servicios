/**
 * Helper utilities for authentication related tasks.
 */
import type { Request } from "express";

/**
 * Extract token from request.
 * Prefers Authorization header (Bearer scheme) then HttpOnly cookie named 'token'.
 */
export const getTokenFromRequest = (req: Request): string | null => {
    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith("Bearer ")) {
        return authorization.slice(7);
    }
    if (req.cookies && typeof req.cookies === "object" && "token" in req.cookies) {
        const cookieToken = (req.cookies as any)["token"];
        if (typeof cookieToken === "string" && cookieToken.trim()) {
            return cookieToken;
        }
    }
    return null;
};
