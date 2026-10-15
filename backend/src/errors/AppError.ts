export const ERROR_CODES = {
    VALIDATION: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    CATALOG_NOT_SEEDED: "CATALOG_NOT_SEEDED",
    DOCUMENT_REQUIRED: "DOCUMENT_REQUIRED",
    INTERNAL: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        public readonly statusCode = 400,
    ) {
        super(message);
        this.name = "AppError";
    }
}

export const validationError = (message: string): AppError =>
    new AppError(ERROR_CODES.VALIDATION, message, 400);

export const notFoundError = (message: string): AppError =>
    new AppError(ERROR_CODES.NOT_FOUND, message, 404);

export const conflictError = (message: string): AppError =>
    new AppError(ERROR_CODES.CONFLICT, message, 409);

export const forbiddenError = (message: string): AppError =>
    new AppError(ERROR_CODES.FORBIDDEN, message, 403);

export const unauthorizedError = (message: string): AppError =>
    new AppError(ERROR_CODES.UNAUTHORIZED, message, 401);
