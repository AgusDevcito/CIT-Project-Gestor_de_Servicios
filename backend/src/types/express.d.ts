import type { JwtPayload } from "../helpers/jwt.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export {};
