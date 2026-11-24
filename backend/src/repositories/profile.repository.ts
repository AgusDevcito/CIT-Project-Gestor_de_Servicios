import { Profile, User } from "../models/index.js";
import type { TipoPerfil } from "../models/profile.model.js";

const userInclude = {
    model: User,
    as: "User",
    attributes: { exclude: ["password"] },
};

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    bio?: string | null;
    tipo_perfil?: TipoPerfil;
    razon_social?: string | null;
    cuit?: string | null;
    localidad?: string | null;
    telefono_whatsapp?: string | null;
}

export const findAllWithUser = () => Profile.findAll({ include: userInclude });

export const findByUserIdWithUser = (userId: number) =>
    Profile.findOne({ where: { user_id: userId }, include: userInclude });

export const findByUserId = (userId: number) =>
    Profile.findOne({ where: { user_id: userId } });

export const ensureForUser = async (userId: number, fallbackName: string) => {
    const existing = await findByUserId(userId);
    if (existing) return existing;
    return Profile.create({
        user_id: userId,
        first_name: fallbackName || "Usuario",
        last_name: "",
        avatar_url: null,
        bio: null,
        tipo_perfil: "PRODUCTOR",
    });
};

export const update = (profile: Profile, data: UpdateProfileData) =>
    profile.update(data);
