
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import * as tokenRepo from "../repositories/citActivationToken.repository.js";
import { User } from "../models/index.js";
import { hashPassword } from "../helpers/password.js";
import { notFoundError, validationError, AppError, ERROR_CODES } from "../errors/AppError.js";

/**
 * Generates a cryptographically‑secure token, stores its bcrypt hash, and returns the plain token.
 * The token expires after the configured interval (default 24 h).
 */
export const createActivationToken = async (userId: number, ttlMs = 24 * 60 * 60 * 1000) => {
    const plain = randomBytes(32).toString("hex"); // 64‑char hex token
    const hash = await bcrypt.hash(plain, 10);
    const expiresAt = new Date(Date.now() + ttlMs);
    await tokenRepo.create({ userId, tokenHash: hash, expiresAt });
    return plain; // only this plain value is ever sent to the user
};

/** Validate a token and set a new password for the associated user. */
export const activateUserWithToken = async (plainToken: string, newPassword: string) => {
    // Load all unused tokens (could be optimized with a query on createdAt/expiry)
    const candidates = await tokenRepo.findByPlainToken(plainToken);
    for (const cand of candidates) {
        const match = await bcrypt.compare(plainToken, cand.token_hash);
        if (!match) continue;
        // token matches – verify not expired and not used
        if (cand.used_at) {
            throw new AppError(ERROR_CODES.CONFLICT, "Token already used", 409);
        }
        if (cand.expires_at.getTime() < Date.now()) {
            throw new AppError(ERROR_CODES.CONFLICT, "Token expired", 409);
        }
        // Load user
        const user = await User.findByPk(cand.user_id);
        if (!user) throw notFoundError("User not found");
        // Update password
        const hashed = await hashPassword(newPassword);
        await user.update({ password: hashed });
        // Mark token used
        await tokenRepo.markUsed(cand);
        return user;
    }
    throw validationError("Invalid activation token");
};
