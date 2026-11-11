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
    return null;
};
