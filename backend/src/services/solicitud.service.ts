import {
    AppError,
    ERROR_CODES,
    conflictError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import { ESTADO } from "../constants/estados.js";
import type { Rol } from "../constants/roles.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as servicioRepository from "../repositories/servicio.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as mailService from "../utils/mail.js";

const ESTADOS_SOLICITUD_ACTIVA: readonly string[] = [
    ESTADO.PENDIENTE,
    ESTADO.APROBADO,
    ESTADO.ACEPTADA,
];

export const list = (user: { id: number; role: Rol }) => {
    const where =
        user.role === "admin" || user.role === "cit" ? {} : { user_id: user.id };
    return solicitudRepository.findAll(where);
};

export const create = async (servicioId: unknown, userId: number) => {
    const idNumerico = Number(servicioId);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw validationError("Debés indicar un servicio válido para solicitar.");
    }

    const servicio = await servicioRepository.findById(idNumerico);
    if (!servicio) {
        throw notFoundError("El servicio solicitado no existe.");
    }

    const estado = await catalogRepository.findEstado(ESTADO.PENDIENTE);
    if (!estado) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El catálogo de estados no está inicializado.",
            500,
        );
    }

    // Evitar solicitudes duplicadas activas del mismo usuario para el mismo servicio
    const existentes = await solicitudRepository.findAll({
        user_id: userId,
        servicio_id: idNumerico,
    });

    const tieneSolicitudActiva = existentes.some((sol) =>
        ESTADOS_SOLICITUD_ACTIVA.includes(sol.Estado?.codigo ?? ""),
    );

    if (tieneSolicitudActiva) {
        throw conflictError(
            "Ya tenés una solicitud en curso para este servicio.",
        );
    }

    return solicitudRepository.create({
        user_id: userId,
        servicio_id: idNumerico,
        estado_id: estado.id,
    });
};

export const updateEstado = async (id: number, estadoValue: unknown) => {
    const estado = await catalogRepository.findEstado(estadoValue);
    if (!estado) throw validationError("El estado no es válido.");

    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) throw notFoundError("Solicitud no encontrada.");

    solicitud.estado_id = estado.id;
    await solicitudRepository.save(solicitud);
    // Notificar al usuario por correo
    const user = await userRepository.findByPk(solicitud.user_id);
    if (user && user.email) {
        await mailService.sendSolicitudStatusEmail(user.email, id, estado.nombre);
    }

    return solicitud;
};
