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
import { ROL, ROLES } from "../constants/roles.js";
import type { Rol } from "../constants/roles.js";

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
        role: requestedRole,
        document_url,
    } = input;

    const uploadedFile = input.file ?? null;
    const resolvedDocumentUrl = uploadedFile
        ? `/uploads/${uploadedFile.filename}`
        : document_url;
    const role = (requestedRole || ROL.USER) as Rol;

    const requiredFields = { first_name, last_name, username, email, password, role };
    if (Object.values(requiredFields).some((value) => !String(value ?? "").trim())) {
        throw validationError("Todos los campos obligatorios deben estar completos.");
    }

    if (!ROLES.includes(role)) {
        throw validationError("El rol solicitado no es válido.");
    }

    validateCITRegistration({ role, documentUrl: resolvedDocumentUrl, file: uploadedFile });

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

    const isMatch = await comparePasswords(password as string, user.password);
    if (!isMatch) {
        throw unauthorizedError("Contraseña Incorrecta");
    }

    return { token: signToken({ id: user.id, email: user.email, role: user.role }) };
};

export const getMyProfile = async (userId: number) => {
    const profile = await profileRepository.findByUserIdWithUser(userId);
    if (!profile) throw notFoundError("Perfil no encontrado");
    return profile;
};
