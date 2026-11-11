import { conflictError, notFoundError, validationError } from "../errors/AppError.js";
import { InscripcionCapacitacion, Publicacion, Sector } from "../models/index.js";
import * as profileRepository from "../repositories/profile.repository.js";
import * as propuestaRepository from "../repositories/propuesta.repository.js";
import * as publicacionRepository from "../repositories/publicacion.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";
import * as userRepository from "../repositories/user.repository.js";

const assertValidUserId = (userId: number): void => {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw validationError("El id del usuario es invalido");
    }
};

export const list = () => profileRepository.findAllWithUser();

export const getByUserId = async (userId: number) => {
    assertValidUserId(userId);

    let profile = await profileRepository.findByUserIdWithUser(userId);
    if (!profile) {
        const user = await userRepository.findByPk(userId);
        if (!user) throw notFoundError("Perfil no encontrado");
        await profileRepository.ensureForUser(user.id, user.username);
        profile = await profileRepository.findByUserIdWithUser(userId);
    }
    if (!profile) throw notFoundError("Perfil no encontrado");

    return profile;
};

export const update = async (
    userId: number,
    input: {
        first_name?: string;
        last_name?: string;
        avatar_url?: string | null;
        bio?: string | null;
    },
) => {
    assertValidUserId(userId);

    let profile = await profileRepository.findByUserId(userId);
    if (!profile) {
        const user = await userRepository.findByPk(userId);
        if (!user) throw notFoundError("Perfil no encontrado");
        profile = await profileRepository.ensureForUser(user.id, user.username);
    }

    const sanitizedUpdate: profileRepository.UpdateProfileData = {};
    if (typeof input.first_name === "string" && input.first_name.trim()) {
        sanitizedUpdate.first_name = input.first_name.trim();
    }
    if (typeof input.last_name === "string" && input.last_name.trim()) {
        sanitizedUpdate.last_name = input.last_name.trim();
    }
    if (input.avatar_url !== undefined) {
        sanitizedUpdate.avatar_url = input.avatar_url?.trim() || null;
    }
    if (input.bio !== undefined) {
        sanitizedUpdate.bio = input.bio?.trim() || null;
    }

    await profileRepository.update(profile, sanitizedUpdate);
    return (await profileRepository.findByUserIdWithUser(userId)) ?? profile;
};

export const listMisCapacitaciones = async (userId: number) => {
    assertValidUserId(userId);

    return InscripcionCapacitacion.findAll({
        where: { user_id: userId },
        include: [
            {
                model: Publicacion,
                as: "Publicacion",
                include: [{ model: Sector, as: "Sector" }],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};

export const inscribirCapacitacion = async (userId: number, publicacionId: number) => {
    assertValidUserId(userId);
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        throw validationError("El identificador de la capacitación no es válido.");
    }

    const publicacion = await publicacionRepository.findByIdWithIncludes(publicacionId);
    if (!publicacion || publicacion.publicado === false) {
        throw notFoundError("La capacitación o actividad solicitada no existe.");
    }

    const existente = await InscripcionCapacitacion.findOne({
        where: {
            user_id: userId,
            publicacion_id: publicacionId,
        },
    });

    if (existente) {
        throw conflictError("Ya te encontrás inscripto en esta capacitación.");
    }

    const creada = await InscripcionCapacitacion.create({
        user_id: userId,
        publicacion_id: publicacionId,
        estado: "INSCRIPTO",
    });

    return InscripcionCapacitacion.findByPk(creada.id, {
        include: [
            {
                model: Publicacion,
                as: "Publicacion",
                include: [{ model: Sector, as: "Sector" }],
            },
        ],
    });
};

export const getActividadUsuario = async (userId: number) => {
    assertValidUserId(userId);

    const [propuestas, servicios, capacitaciones] = await Promise.all([
        propuestaRepository.findBySolicitante(userId),
        solicitudRepository.findAll({ user_id: userId }),
        listMisCapacitaciones(userId),
    ]);

    return {
        propuestas,
        servicios,
        capacitaciones,
    };
};
