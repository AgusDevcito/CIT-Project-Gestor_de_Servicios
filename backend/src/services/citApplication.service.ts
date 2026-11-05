import { AppError, ERROR_CODES, validationError, notFoundError } from "../errors/AppError.js";

import * as citRepo from "../repositories/citApplication.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import { ROL } from "../constants/roles.js";
import { sendCitApplicationNotification, sendCitApplicationResult } from "../utils/mail.js";
import { sequelize } from "../config/db.js";
import { createActivationToken } from "../services/activation.service.js";
import { fileTypeFromBuffer } from "file-type";
import { promises as fsPromises } from "node:fs";
import { randomUUID } from "crypto";

// Simple validators
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,100}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dniRegex = /^\d{7,8}$/;

export const createApplication = async (
    data: {
        first_name: string;
        last_name: string;
        dni: string;
        email: string;
    },
    files: { dni_front?: Express.Multer.File[]; dni_back?: Express.Multer.File[] },
) => {
    // Validate required fields
    if (!nameRegex.test(data.first_name)) {
        throw validationError("Nombre inválido");
    }
    if (!nameRegex.test(data.last_name)) {
        throw validationError("Apellido inválido");
    }
    if (!dniRegex.test(data.dni)) {
        throw validationError("DNI debe ser numérico de 7 u 8 dígitos");
    }
    if (!emailRegex.test(data.email)) {
        throw validationError("Correo electrónico inválido");
    }

    if (!files.dni_front || files.dni_front.length === 0) {
        throw validationError("Imagen del frente del DNI es obligatoria");
    }
    if (!files.dni_back || files.dni_back.length === 0) {
        throw validationError("Imagen del dorso del DNI es obligatoria");
    }



    // Validate file signatures (JPEG/PNG only)
    const validateFile = async (file: Express.Multer.File) => {
        const buffer = await fsPromises.readFile(file.path);
        const type = await fileTypeFromBuffer(buffer);
        if (!type) {
            await fsPromises.unlink(file.path);
            throw validationError("Archivo vacío o sin firma válida");
        }
        if (!["image/jpeg", "image/png"].includes(type.mime)) {
            await fsPromises.unlink(file.path);
            throw validationError("Formato de archivo no permitido");
        }
    };
    await Promise.all([
        validateFile(files.dni_front![0]),
        validateFile(files.dni_back![0]),
    ]);

    const existing = await citRepo.findPendingByDni(data.dni);
    if (existing) {
        throw new AppError(ERROR_CODES.CONFLICT, "Ya existe una solicitud pendiente con el mismo DNI", 409);
    }

    const dni_front_path = files.dni_front[0].path;
    const dni_back_path = files.dni_back[0].path;


    const application = await citRepo.create({
        ...data,
        dni_front_path,
        dni_back_path,
    });

    // Notify admins (retrieve admin emails)
    const allUsers = await userRepo.findAllWithProfile();
    const adminEmails = allUsers.filter((u: any) => u.role === "admin").map((u: any) => u.email);
    if (adminEmails.length > 0) {
        await sendCitApplicationNotification(adminEmails, application.id);
    }
    return application;
};

export const listApplications = async (user: { id: number; role: string }) => {
    if (user.role !== "admin") {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, "Solo administradores pueden listar solicitudes", 403);
    }
    return citRepo.findAll();
};

export const getApplication = async (id: number, user: { role: string }) => {
    if (user.role !== "admin") {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, "Acceso prohibido", 403);
    }
    const app = await citRepo.findById(id);
    if (!app) throw notFoundError("Solicitud no encontrada");
    return app;
};

export const approveApplication = async (id: number, adminId: number) => {
    const transaction = await sequelize.transaction();
    try {
        const app = await citRepo.findById(id);
        if (!app) throw notFoundError("Solicitud no encontrada");
        if (app.status !== "PENDING") {
            throw validationError("Solo se pueden aprobar solicitudes en estado PENDING");
        }
        // Create CIT user
        const username = app.email; // use email as username
        const password = randomUUID(); // temporary password placeholder (will be reset via token)
        const user = await userRepo.createUserWithProfile(
            { username, email: app.email, password, role: ROL.CIT },
            { first_name: app.first_name, last_name: app.last_name },
        );
        // Update application
        await citRepo.update(app, {
            status: "APPROVED" as any,
            reviewed_by: adminId,
            reviewed_at: new Date(),
        });
        // Generate activation token (persisted hash, plain token sent via email)
        const token = await createActivationToken(user.id);
        // Record outbox notification (to be sent asynchronously)
        await import("../repositories/outbox.repository.js").then(m => m.create({
            recipient: app.email,
            subject: "Activación de cuenta CIT",
            body: `Su token de activación es: ${token}`,
        }));
        // Send email to applicant with activation token (optional, can be processed by worker)
        await sendCitApplicationResult(app.email, app.id, true, token);


        await transaction.commit();
        return { user, token };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const rejectApplication = async (id: number, adminId: number, reason: string) => {
    const app = await citRepo.findById(id);
    if (!app) throw notFoundError("Solicitud no encontrada");
    if (app.status !== "PENDING") {
        throw validationError("Solo se pueden rechazar solicitudes en estado PENDING");
    }
    await citRepo.update(app, {
        status: "REJECTED" as any,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        rejection_reason: reason,
    });
    await sendCitApplicationResult(app.email, app.id, false, undefined, reason);
    return app;
};
