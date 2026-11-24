import bcrypt from "bcrypt";
import { sequelize } from "../config/db.js";
import { ESTADO } from "../constants/estados.js";
import { ROL } from "../constants/roles.js";
import {
    conflictError,
    notFoundError,
    unauthorizedError,
    validationError,
} from "../errors/AppError.js";
import {
    InscripcionCapacitacion,
    Profile,
    Propuesta,
    Publicacion,
    Sector,
    Solicitud,
    User,
} from "../models/index.js";
import {
    ESTADOS_INSCRIPCION,
    type EstadoInscripcion,
} from "../models/inscripcionCapacitacion.model.js";
import { TIPOS_PERFIL, type TipoPerfil } from "../models/profile.model.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
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
        tipo_perfil?: string;
        razon_social?: string | null;
        cuit?: string | null;
        localidad?: string | null;
        telefono_whatsapp?: string | null;
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
    if (typeof input.tipo_perfil === "string") {
        const normalizedTipo = input.tipo_perfil
            .trim()
            .toUpperCase() as TipoPerfil;
        if (!TIPOS_PERFIL.includes(normalizedTipo)) {
            throw validationError("El tipo de perfil indicado no es válido.");
        }
        sanitizedUpdate.tipo_perfil = normalizedTipo;
    }
    if (input.razon_social !== undefined) {
        sanitizedUpdate.razon_social =
            input.razon_social?.trim().slice(0, 150) || null;
    }
    if (input.cuit !== undefined) {
        sanitizedUpdate.cuit = input.cuit?.trim().slice(0, 30) || null;
    }
    if (input.localidad !== undefined) {
        sanitizedUpdate.localidad =
            input.localidad?.trim().slice(0, 120) || null;
    }
    if (input.telefono_whatsapp !== undefined) {
        sanitizedUpdate.telefono_whatsapp =
            input.telefono_whatsapp?.trim().slice(0, 40) || null;
    }

    await profileRepository.update(profile, sanitizedUpdate);
    return (await profileRepository.findByUserIdWithUser(userId)) ?? profile;
};

export const eliminarCuenta = async (
    userId: number,
    input: { password?: string; confirmacion?: string },
) => {
    assertValidUserId(userId);

    const confirmacion = input.confirmacion?.trim().toUpperCase() ?? "";
    if (confirmacion !== "ELIMINAR") {
        throw validationError(
            'Para confirmar la baja debés escribir exactamente la palabra "ELIMINAR".',
        );
    }

    const password = input.password ?? "";
    if (!password) {
        throw validationError(
            "Debés ingresar tu contraseña actual para confirmar la eliminación de la cuenta.",
        );
    }

    const user = await userRepository.findByPk(userId);
    if (!user || !user.isActive) {
        throw notFoundError("Usuario no encontrado.");
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
        throw unauthorizedError("La contraseña actual ingresada es incorrecta.");
    }

    if (user.role === ROL.ADMIN) {
        const adminsActivos = await User.count({
            where: { role: ROL.ADMIN, isActive: true },
        });
        if (adminsActivos <= 1) {
            throw conflictError(
                "No es posible eliminar la única cuenta administradora activa del sistema.",
            );
        }
    }

    let estadoCancelada = await catalogRepository.findEstado(ESTADO.CANCELADA);
    if (!estadoCancelada) {
        await catalogRepository.upsertEstado(ESTADO.CANCELADA, "Cancelada");
        estadoCancelada = await catalogRepository.findEstado(ESTADO.CANCELADA);
    }
    const estadoPendiente = await catalogRepository.findEstado(ESTADO.PENDIENTE);

    await sequelize.transaction(async (transaction) => {
        if (estadoCancelada && estadoPendiente) {
            await Propuesta.update(
                { estado_id: estadoCancelada.id },
                {
                    where: {
                        solicitante: userId,
                        estado_id: estadoPendiente.id,
                    },
                    transaction,
                },
            );
            await Solicitud.update(
                {
                    estado_id: estadoCancelada.id,
                    fecha_cancelacion: new Date(),
                    cancelado_por_id: userId,
                },
                {
                    where: {
                        user_id: userId,
                        estado_id: estadoPendiente.id,
                    },
                    transaction,
                },
            );
        }

        const profile = await Profile.findOne({
            where: { user_id: userId },
            transaction,
        });
        if (profile) {
            await profile.update(
                {
                    first_name: "Cuenta",
                    last_name: "Eliminada",
                    avatar_url: null,
                    bio: null,
                    razon_social: null,
                    cuit: null,
                    localidad: null,
                    telefono_whatsapp: null,
                },
                { transaction },
            );
        }

        const ts = Date.now();
        await user.update(
            {
                username: `deleted_${userId}_${ts}`,
                email: `deleted_${userId}_${ts}@anon.citio.local`,
                isActive: false,
                document_url: null,
                document_name: null,
            },
            { transaction },
        );
    });

    return { ok: true };
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

export const inscribirCapacitacion = async (
    userId: number,
    publicacionId: number,
) => {
    assertValidUserId(userId);
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        throw validationError(
            "El identificador de la capacitación no es válido.",
        );
    }

    const publicacion =
        await publicacionRepository.findByIdWithIncludes(publicacionId);
    if (!publicacion || publicacion.publicado === false) {
        throw notFoundError("La capacitación o actividad solicitada no existe.");
    }

    const TIPOS_INSCRIBIBLES: readonly string[] = [
        "capacitacion",
        "inscripcion",
        "jornada",
    ];
    if (!TIPOS_INSCRIBIBLES.includes(publicacion.tipo_contenido)) {
        throw validationError(
            "Solo es posible inscribirse en publicaciones de tipo capacitación, inscripción o jornada.",
        );
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

export const listInscriptosCapacitacion = async (publicacionId: number) => {
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        throw validationError(
            "El identificador de la capacitación no es válido.",
        );
    }

    return InscripcionCapacitacion.findAll({
        where: { publicacion_id: publicacionId },
        include: [
            {
                model: User,
                as: "Participante",
                attributes: ["id", "username", "email", "role"],
                include: [{ model: Profile, as: "Profile" }],
            },
            {
                model: Publicacion,
                as: "Publicacion",
                include: [{ model: Sector, as: "Sector" }],
            },
        ],
        order: [["createdAt", "ASC"]],
    });
};

export const updateEstadoInscripcionCapacitacion = async (
    inscripcionId: number,
    nuevoEstado: unknown,
    observaciones?: unknown,
) => {
    if (!Number.isInteger(inscripcionId) || inscripcionId <= 0) {
        throw validationError("El identificador de la inscripción no es válido.");
    }

    const estadoUpper =
        typeof nuevoEstado === "string"
            ? (nuevoEstado.trim().toUpperCase() as EstadoInscripcion)
            : ("" as EstadoInscripcion);

    if (!ESTADOS_INSCRIPCION.includes(estadoUpper)) {
        throw validationError(
            "El estado de inscripción debe ser INSCRIPTO, EN_CURSO o FINALIZADO.",
        );
    }

    const inscripcion = await InscripcionCapacitacion.findByPk(inscripcionId);
    if (!inscripcion) {
        throw notFoundError("Inscripción no encontrada.");
    }

    inscripcion.estado = estadoUpper;
    if (observaciones !== undefined) {
        inscripcion.observaciones =
            typeof observaciones === "string" && observaciones.trim()
                ? observaciones.trim().slice(0, 255)
                : null;
    }
    await inscripcion.save();

    return InscripcionCapacitacion.findByPk(inscripcionId, {
        include: [
            {
                model: User,
                as: "Participante",
                attributes: ["id", "username", "email", "role"],
                include: [{ model: Profile, as: "Profile" }],
            },
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
