import { notFoundError, validationError } from "../errors/AppError.js";
import type { TipoContenido } from "../models/publicacion.model.js";
import * as archivoRepository from "../repositories/archivo.repository.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as publicacionRepository from "../repositories/publicacion.repository.js";

export interface CreatePublicacionInput {
    titulo?: string;
    contenido?: string;
    tipo_contenido?: TipoContenido;
    sector_id?: number | string;
    sector?: string;
}

export interface UpdatePublicacionInput extends CreatePublicacionInput {}

const assertValidId = (id: number): void => {
    if (!Number.isInteger(id) || id <= 0) {
        throw validationError("El id de la publicacion es invalido");
    }
};

export const list = () => publicacionRepository.findAll();

export const getById = async (id: number) => {
    assertValidId(id);

    const publicacion = await publicacionRepository.findByIdWithIncludes(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    return publicacion;
};

export const create = async (input: CreatePublicacionInput, authorId: number) => {
    const { titulo, contenido, tipo_contenido, sector_id: requestedSector, sector } = input;

    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);
    if (!titulo || !contenido || !sectorItem) {
        throw validationError("El titulo y el contenido son obligatorios");
    }

    return publicacionRepository.create({
        titulo,
        contenido,
        tipo_contenido,
        sector_id: sectorItem.id,
        author_id: authorId,
    });
};

export const update = async (id: number, input: UpdatePublicacionInput) => {
    const publicacion = await publicacionRepository.findById(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    const { titulo, contenido, tipo_contenido, sector_id: requestedSector, sector } = input;
    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);
    if (!sectorItem) {
        throw validationError("El sector no es válido");
    }

    return publicacionRepository.update(publicacion, {
        titulo,
        contenido,
        tipo_contenido,
        sector_id: sectorItem.id,
    });
};

export const remove = async (id: number) => {
    const publicacion = await publicacionRepository.findById(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    await archivoRepository.destroyByPublicacion(id);
    await publicacionRepository.destroy(publicacion);
};
