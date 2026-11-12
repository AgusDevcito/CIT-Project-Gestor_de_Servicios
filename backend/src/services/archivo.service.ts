import { notFoundError, validationError } from "../errors/AppError.js";
import type { TipoArchivo } from "../models/archivoPublicacion.model.js";
import * as archivoRepository from "../repositories/archivo.repository.js";
import * as publicacionRepository from "../repositories/publicacion.repository.js";

export interface CreateArchivoInput {
    tipo?: TipoArchivo;
    archivo_url?: string;
    archivo_nombre?: string | null;
    orden?: number;
}

const ESQUEMA_URL_PERMITIDO = /^(https?:\/\/|\/)/i;

export const listByPublicacion = async (
    publicacionId: number,
    options: { includeDrafts?: boolean } = {},
) => {
    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        throw validationError("El id de la publicacion es invalido");
    }

    const publicacion = await publicacionRepository.findById(publicacionId);
    if (!publicacion || (publicacion.publicado === false && !options.includeDrafts)) {
        throw notFoundError("Publicacion no encontrada");
    }

    return archivoRepository.findByPublicacion(publicacionId);
};

export const create = async (publicacionId: number, input: CreateArchivoInput) => {
    const { tipo, archivo_url, archivo_nombre, orden } = input;
    const urlLimpia = archivo_url?.trim() ?? "";

    if (!urlLimpia) {
        throw validationError("La URL del archivo es obligatoria");
    }

    if (!ESQUEMA_URL_PERMITIDO.test(urlLimpia)) {
        throw validationError(
            "La URL del archivo debe comenzar con http://, https:// o /",
        );
    }

    const publicacion = await publicacionRepository.findById(publicacionId);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    return archivoRepository.create({
        publicacion_id: publicacionId,
        tipo,
        archivo_url: urlLimpia,
        archivo_nombre,
        orden,
    });
};

export const remove = async (id: number) => {
    const archivo = await archivoRepository.findById(id);
    if (!archivo) throw notFoundError("Archivo no encontrado");

    await archivoRepository.destroy(archivo);
};
