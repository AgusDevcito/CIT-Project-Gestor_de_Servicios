import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError, ERROR_CODES } from "../errors/AppError.js";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

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
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new AppError(ERROR_CODES.VALIDATION, "Solo se permiten PDF, JPG o PNG.", 400));
    },
});
