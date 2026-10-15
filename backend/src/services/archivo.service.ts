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

export const listByPublicacion = (publicacionId: number) =>
    archivoRepository.findByPublicacion(publicacionId);

export const create = async (publicacionId: number, input: CreateArchivoInput) => {
    const { tipo, archivo_url, archivo_nombre, orden } = input;

    if (!archivo_url) {
        throw validationError("La URL del archivo es obligatoria");
    }

    const publicacion = await publicacionRepository.findById(publicacionId);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    return archivoRepository.create({
        publicacion_id: publicacionId,
        tipo,
        archivo_url,
        archivo_nombre,
        orden,
    });
};

export const remove = async (id: number) => {
    const archivo = await archivoRepository.findById(id);
    if (!archivo) throw notFoundError("Archivo no encontrado");

    await archivoRepository.destroy(archivo);
};
