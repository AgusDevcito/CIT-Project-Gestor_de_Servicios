import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ msg: "Recurso no encontrado" });
};

interface MulterLikeError {
    name?: string;
    code?: string;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ msg: error.message, code: error.code });
    }

    const multerError = error as MulterLikeError;
    if (multerError?.name === "MulterError" && multerError?.code === "LIMIT_FILE_SIZE") {
        return res
            .status(413)
            .json({ msg: "El archivo supera el tamaño máximo permitido." });
    }

    console.error("Error no controlado:", error);
    return res.status(500).json({ msg: "Error interno del servidor" });
};
