import { notFoundError, validationError } from "../errors/AppError.js";
import * as profileRepository from "../repositories/profile.repository.js";

const assertValidUserId = (userId: number): void => {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw validationError("El id del usuario es invalido");
    }
};

export const list = () => profileRepository.findAllWithUser();

export const getByUserId = async (userId: number) => {
    assertValidUserId(userId);

    const profile = await profileRepository.findByUserIdWithUser(userId);
    if (!profile) throw notFoundError("Perfil no encontrado");

    return profile;
};

export const update = async (
    userId: number,
    input: { first_name?: string; last_name?: string; avatar_url?: string | null },
) => {
    assertValidUserId(userId);

    const profile = await profileRepository.findByUserId(userId);
    if (!profile) throw notFoundError("Perfil no encontrado");

    return profileRepository.update(profile, input);
};
