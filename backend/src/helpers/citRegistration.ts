import { AppError, ERROR_CODES } from "../errors/AppError.js";

export interface UploadedFile {
    filename: string;
    originalname: string;
}

export interface CITRegistrationInput {
    role: string;
    documentUrl?: string | null;
    file?: UploadedFile | null;
}

export const validateCITRegistration = ({
    role,
    documentUrl,
    file,
}: CITRegistrationInput): void => {
    const normalizedRole = String(role ?? "").trim().toLowerCase();
    const hasDocument = Boolean(
        (documentUrl && String(documentUrl).trim()) || (file && file.originalname),
    );

    if (normalizedRole === "cit" && !hasDocument) {
        throw new AppError(
            ERROR_CODES.DOCUMENT_REQUIRED,
            "Los trabajadores de CIT Formosa deben adjuntar un documento para registrarse.",
            400,
        );
    }
};
