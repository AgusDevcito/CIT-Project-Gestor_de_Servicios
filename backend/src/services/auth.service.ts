import {
    notFoundError,
    unauthorizedError,
    validationError,
} from "../errors/AppError.js";
import { validateCITRegistration } from "../helpers/citRegistration.js";
import type { UploadedFile } from "../helpers/citRegistration.js";
import { signToken } from "../helpers/jwt.js";
import { comparePasswords, hashPassword } from "../helpers/password.js";
import * as userRepository from "../repositories/user.repository.js";
import * as tokenRepo from "../repositories/citActivationToken.repository.js";
import { createActivationToken } from "../services/activation.service.js";
import { activateUserWithToken } from "../services/activation.service.js";
import { ROL, ROLES } from "../constants/roles.js";

export interface RegisterInput {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    document_url?: string;
    file?: UploadedFile | null;
}

export const register = async (input: RegisterInput) => {
    const {
        first_name,
        last_name,
        avatar_url,
        username,
        email,
        password,
        // role: requestedRole, // role is ignored on public registration
        document_url,
    } = input;

    const uploadedFile = input.file ?? null;
    const resolvedDocumentUrl = uploadedFile
        ? `/uploads/${uploadedFile.filename}`
        : document_url;
    // Public registration always creates a USER; CIT should be approved later by admin
    const role = ROL.USER;

    const requiredFields = { first_name, last_name, username, email, password };
    if (Object.values(requiredFields).some((value) => !String(value ?? "").trim())) {
        throw validationError("Todos los campos obligatorios deben estar completos.");
    }

    // Validate role is valid (USER is always valid)
    if (!ROLES.includes(role)) {
        throw validationError("El rol solicitado no es válido.");
    }

    // If the client attempted to request CIT, enforce document requirement (even though role will be USER)
    const requestedRole = (input.role as string) ?? ROL.USER;
    if (requestedRole === ROL.CIT) {
        // Ensure a document is provided; otherwise throw as before
        validateCITRegistration({ role: requestedRole, documentUrl: resolvedDocumentUrl, file: uploadedFile });
    }

    await userRepository.createUserWithProfile(
        {
            username: username as string,
            email: email as string,
            password: await hashPassword(password as string),
            role,
            document_url: resolvedDocumentUrl || null,
            document_name: uploadedFile ? uploadedFile.originalname : null,
        },
        {
            first_name: first_name as string,
            last_name: last_name as string,
            avatar_url: avatar_url ?? null,
        },
    );

    return { documentUrl: resolvedDocumentUrl };
};

export const login = async (username?: string, password?: string) => {
    if (!String(username ?? "").trim() || !String(password ?? "").trim()) {
        throw validationError("El usuario y la contraseña son obligatorios.");
    }

    const user = await userRepository.findByUsernameWithProfile(username as string);
    if (!user) {
        throw unauthorizedError("Credenciales incorrectas o invalidas");
    }

    if (!user.isActive) {
        throw unauthorizedError("Cuenta desactivada. Contacte al administrador.");
    }
    const pending = await tokenRepo.findValidByUser(user.id);
    if (pending) {
        throw unauthorizedError("Cuenta pendiente de activación. Complete el proceso antes de iniciar sesión.");
    }

    const isMatch = await comparePasswords(password as string, user.password);
    if (!isMatch) {
        throw unauthorizedError("Contraseña Incorrecta");
    }
    return { token: signToken({ id: user.id, email: user.email, role: user.role }) };
};

export const forgotPassword = async (email: string) => {
    // Uniform response to avoid email enumeration
    const genericMsg = { msg: "Si el email está registrado, recibirás un enlace para restablecer la contraseña" };
    if (!email) return genericMsg;
    const user = await userRepository.findByEmail(email);
    if (!user) {
        // Do not reveal that email does not exist
        return genericMsg;
    }
    // Generate a short‑lived token (15 min)
    const token = await createActivationToken(user.id, 15 * 60 * 1000);
    // Send email (outbox will deliver asynchronously)
    await import("../utils/mail.js").then(m => m.sendPasswordResetEmail(email, token));
    return genericMsg;
};

export const resetPassword = async (plainToken: string, newPassword: string) => {
    // Validate password policy (min 8 chars, at least one number, one letter)
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        throw validationError("La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
    }
    // Reuse activation service to validate token and set password
    await activateUserWithToken(plainToken, newPassword);
    return { msg: "Contraseña actualizada correctamente" };
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
    const user = await userRepository.findByPk(userId);
    if (!user) throw notFoundError("Usuario no encontrado");
    const match = await comparePasswords(currentPassword, user.password);
    if (!match) throw unauthorizedError("Contraseña actual incorrecta");
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        throw validationError("La nueva contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
    }
    await userRepository.update(user, { password: await hashPassword(newPassword) });
    return { msg: "Contraseña cambiada correctamente" };
};

    const profile = await profileRepository.findByUserIdWithUser(userId);
    if (!profile) throw notFoundError("Perfil no encontrado");
    return profile;
};
