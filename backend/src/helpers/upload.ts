import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError, ERROR_CODES } from "../errors/AppError.js";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

export const uploadDocument = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const mimeOk =
            !file.mimetype ||
            file.mimetype === "application/octet-stream" ||
            allowedMimeTypes.includes(file.mimetype);

        if (!allowedExtensions.has(ext) || !mimeOk) {
            cb(
                new AppError(
                    ERROR_CODES.VALIDATION,
                    "Formato de archivo no permitido. Solo se aceptan documentos PDF, PNG o JPG.",
                    400,
                ),
            );
            return;
        }
        cb(null, true);
    },
});
