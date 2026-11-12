/**
 * Helper utilities for authentication related tasks.
 */
import type { Request } from "express";

/**
 * Extract token from request.
 * Reads the Authorization header (Bearer scheme).
 */
export const getTokenFromRequest = (req: Request): string | null => {
    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith("Bearer ")) {
        return authorization.slice(7);
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        for (const pair of cookieHeader.split(";")) {
            const [rawKey, ...rawVal] = pair.trim().split("=");
            if (rawKey === "token" && rawVal.length > 0) {
                return rawVal.join("=").trim() || null;
            }
        }
    }

    return null;
};
