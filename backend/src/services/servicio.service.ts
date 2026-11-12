import {
    conflictError,
    forbiddenError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import { ESTADO } from "../constants/estados.js";
import type { Rol } from "../constants/roles.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as servicioRepository from "../repositories/servicio.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";

export interface CreateServicioInput {
    servicio_nombre?: string;
    servicio_description?: string;
    servicio_img?: string | null;
    servicio_precio?: number | string;
    sector_id?: number | string;
    sector?: string;
}

export interface CreateResenaInput {
    calificacion?: number | string;
    comentario?: string;
}

export const list = () => servicioRepository.findAll();

export const getById = async (id: number) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador del servicio no es válido.");
    }
    const servicio = await servicioRepository.findById(id);
    if (!servicio) {
        throw notFoundError("Servicio no encontrado.");
    }
    return servicio;
};

export const create = async (input: CreateServicioInput, proveedorId: number) => {
    const {
        servicio_nombre,
        servicio_description,
        servicio_img,
        servicio_precio,
        sector_id: requestedSector,
        sector,
    } = input;

    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);

    if (
        !servicio_nombre ||
        !servicio_description ||
        servicio_precio === undefined ||
        !sectorItem
    ) {
        throw validationError(
            "Nombre, descripción, precio y sector válido son obligatorios.",
        );
    }

    const precioNumerico = Number(servicio_precio);
    if (!Number.isFinite(precioNumerico) || precioNumerico < 0) {
        throw validationError("El precio del servicio debe ser mayor o igual a 0.");
    }

    return servicioRepository.create({
        servicio_nombre: servicio_nombre.trim(),
        servicio_description: servicio_description.trim(),
        servicio_img: servicio_img?.trim() || null,
        servicio_precio: precioNumerico,
        sector_id: sectorItem.id,
        proveedor_id: proveedorId,
    });
};

export const createResena = async (
    servicioId: number,
    input: CreateResenaInput,
    user: { id: number; role: Rol },
) => {
    if (!Number.isFinite(servicioId) || servicioId <= 0) {
        throw validationError("El identificador del servicio no es válido.");
    }

    if (user.role !== "user") {
        throw forbiddenError(
            "Solo los usuarios solicitantes pueden calificar servicios.",
        );
    }

    const servicio = await servicioRepository.findById(servicioId);
    if (!servicio) {
        throw notFoundError("Servicio no encontrado.");
    }

    const calificacionNum = Number(input.calificacion);
    if (
        !Number.isInteger(calificacionNum) ||
        calificacionNum < 1 ||
        calificacionNum > 5
    ) {
        throw validationError(
            "La calificación debe ser un número entero entre 1 y 5.",
        );
    }

    const comentarioLimpio = input.comentario?.trim() ?? "";
    if (comentarioLimpio.length < 10 || comentarioLimpio.length > 1000) {
        throw validationError(
            "La reseña debe tener entre 10 y 1000 caracteres.",
        );
    }

    // Verificar que el usuario haya solicitado el servicio (con estado no rechazado)
    const solicitudesUsuario = await solicitudRepository.findAll({
        user_id: user.id,
        servicio_id: servicioId,
    });

    const tieneSolicitudValida = solicitudesUsuario.some(
        (sol) => sol.Estado?.codigo !== ESTADO.RECHAZADO,
    );

    if (!tieneSolicitudValida) {
        throw forbiddenError(
            "Solo podés calificar servicios que hayas solicitado previamente.",
        );
    }

    // Evitar calificaciones repetidas del mismo usuario sobre el mismo servicio
    const existente = await servicioRepository.findResenaByUserAndServicio(
        servicioId,
        user.id,
    );
    if (existente) {
        throw conflictError(
            "Ya registraste una calificación y reseña para este servicio.",
        );
    }

    return servicioRepository.createResena({
        servicio_id: servicioId,
        user_id: user.id,
        calificacion: calificacionNum,
        comentario: comentarioLimpio,
    });
};

export const remove = async (id: number, user: { id: number; role: Rol }) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador del servicio no es válido.");
    }
    const servicio = await servicioRepository.findById(id);
    if (!servicio) {
        throw notFoundError("Servicio no encontrado.");
    }
    if (user.role !== "cit" && user.role !== "admin") {
        throw forbiddenError(
            "Solo el personal del CIT o administradores pueden eliminar servicios.",
        );
    }
    await servicioRepository.deleteById(id);
    return { id, servicio_nombre: servicio.servicio_nombre };
};
