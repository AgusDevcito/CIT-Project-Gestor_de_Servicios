import { AppError, ERROR_CODES, notFoundError, validationError } from "../errors/AppError.js";
import { ESTADO } from "../constants/estados.js";
import type { Rol } from "../constants/roles.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";

export const list = (user: { id: number; role: Rol }) => {
    const where =
        user.role === "admin" || user.role === "cit" ? {} : { user_id: user.id };
    return solicitudRepository.findAll(where);
};

export const create = async (servicioId: unknown, userId: number) => {
    const estado = await catalogRepository.findEstado(ESTADO.PENDIENTE);
    if (!estado) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El catálogo de estados no está inicializado.",
            500,
        );
    }

    return solicitudRepository.create({
        user_id: userId,
        servicio_id: Number(servicioId),
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

    return solicitud;
};
