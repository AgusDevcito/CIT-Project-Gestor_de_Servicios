import {
    notFoundError,
    unauthorizedError,
    validationError,
} from "../errors/AppError.js";
import { validateCITRegistration } from "../helpers/citRegistration.js";
import type { UploadedFile } from "../helpers/citRegistration.js";
import { signToken } from "../helpers/jwt.js";
import { comparePasswords, hashPassword } from "../helpers/password.js";
import * as profileRepository from "../repositories/profile.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as tokenRepo from "../repositories/citActivationToken.repository.js";
import { createActivationToken, activateUserWithToken } from "../services/activation.service.js";
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
        document_url,
    } = input;

    const uploadedFile = input.file ?? null;
    const resolvedDocumentUrl = uploadedFile
        ? `/uploads/${uploadedFile.filename}`
        : document_url;

    // El registro público siempre crea un usuario con rol "user".
    // El personal CIT y los administradores son dados de alta por administración.
    const role = ROL.USER;

    const requiredFields = { first_name, last_name, username, email, password };
    if (Object.values(requiredFields).some((value) => !String(value ?? "").trim())) {
        throw validationError("Todos los campos obligatorios deben estar completos.");
    }

    if (!ROLES.includes(role)) {
        throw validationError("El rol solicitado no es válido.");
    }

    const requestedRole = (input.role as string) ?? ROL.USER;
    if (requestedRole === ROL.CIT) {
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

    return { documentUrl: resolvedDocumentUrl ?? null };
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
    const genericMsg = { msg: "Si el email está registrado, recibirás un enlace para restablecer la contraseña" };
    if (!email) return genericMsg;
    const user = await userRepository.findByEmail(email);
    if (!user) {
        return genericMsg;
    }
    const token = await createActivationToken(user.id, 15 * 60 * 1000);
    await import("../utils/mail.js").then((m) => m.sendPasswordResetEmail(email, token));
    return genericMsg;
};

export const resetPassword = async (plainToken: string, newPassword: string) => {
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        throw validationError("La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.");
    }
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

export const getMyProfile = async (userId: number) => {
    const profile = await profileRepository.findByUserIdWithUser(userId);
    if (!profile) throw notFoundError("Perfil no encontrado");
    return profile;
};
