import { notFoundError, validationError } from "../errors/AppError.js";
import type { TipoArchivo } from "../models/archivoPublicacion.model.js";
import { TIPOS_CONTENIDO, type TipoContenido } from "../models/publicacion.model.js";
import * as archivoRepository from "../repositories/archivo.repository.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as publicacionRepository from "../repositories/publicacion.repository.js";

export interface CreatePublicacionInput {
    titulo?: string;
    contenido?: string;
    tipo_contenido?: TipoContenido;
    sector_id?: number | string;
    sector?: string;
    publicado?: boolean;
    imagen_url?: string;
    archivo_url?: string;
    archivo_nombre?: string;
    archivo_tipo?: TipoArchivo;
}

export interface UpdatePublicacionInput extends CreatePublicacionInput {}

const assertValidId = (id: number): void => {
    if (!Number.isInteger(id) || id <= 0) {
        throw validationError("El id de la publicacion es invalido");
    }
};

const resolveTipoContenido = (tipo?: string): TipoContenido => {
    if (!tipo) return "noticia";
    const normalized = tipo.trim().toLowerCase() as TipoContenido;
    if (!TIPOS_CONTENIDO.includes(normalized)) {
        throw validationError("La categoría o tipo de publicación no es válido");
    }
    return normalized;
};

export const list = (options: { includeDrafts?: boolean } = {}) =>
    publicacionRepository.findAll(options);

export const getById = async (id: number, options: { includeDrafts?: boolean } = {}) => {
    assertValidId(id);

    const publicacion = await publicacionRepository.findByIdWithIncludes(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    if (publicacion.publicado === false && !options.includeDrafts) {
        throw notFoundError("Publicacion no encontrada");
    }

    return publicacion;
};

export const create = async (input: CreatePublicacionInput, authorId: number) => {
    const {
        titulo,
        contenido,
        tipo_contenido,
        sector_id: requestedSector,
        sector,
        publicado,
        imagen_url,
        archivo_url,
        archivo_nombre,
        archivo_tipo,
    } = input;

    const tituloLimpio = titulo?.trim() ?? "";
    const contenidoLimpio = contenido?.trim() ?? "";
    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);

    if (!tituloLimpio || !contenidoLimpio || !sectorItem) {
        throw validationError("El título, el contenido y el sector son obligatorios");
    }

    const tipoValido = resolveTipoContenido(tipo_contenido);
    const created = await publicacionRepository.create({
        titulo: tituloLimpio,
        contenido: contenidoLimpio,
        tipo_contenido: tipoValido,
        sector_id: sectorItem.id,
        author_id: authorId,
        publicado: typeof publicado === "boolean" ? publicado : true,
    });

    const recursoUrl = (imagen_url ?? archivo_url)?.trim();
    if (recursoUrl) {
        await archivoRepository.create({
            publicacion_id: created.id,
            tipo: archivo_tipo === "video" ? "video" : "imagen",
            archivo_url: recursoUrl,
            archivo_nombre: archivo_nombre?.trim() || tituloLimpio,
            orden: 0,
        });
    }

    return (await publicacionRepository.findByIdWithIncludes(created.id)) ?? created;
};

export const update = async (id: number, input: UpdatePublicacionInput) => {
    assertValidId(id);

    const publicacion = await publicacionRepository.findById(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    const {
        titulo,
        contenido,
        tipo_contenido,
        sector_id: requestedSector,
        sector,
        publicado,
        imagen_url,
        archivo_url,
        archivo_nombre,
        archivo_tipo,
    } = input;

    const sectorItem = await catalogRepository.findSector(
        requestedSector ?? sector ?? publicacion.sector_id,
    );
    if (!sectorItem) {
        throw validationError("El sector no es válido");
    }

    const tipoValido = tipo_contenido
        ? resolveTipoContenido(tipo_contenido)
        : publicacion.tipo_contenido;

    await publicacionRepository.update(publicacion, {
        titulo: titulo?.trim() || publicacion.titulo,
        contenido: contenido?.trim() || publicacion.contenido,
        tipo_contenido: tipoValido,
        sector_id: sectorItem.id,
        publicado: typeof publicado === "boolean" ? publicado : publicacion.publicado,
    });

    const recursoUrl = (imagen_url ?? archivo_url)?.trim();
    if (recursoUrl) {
        const existentes = await archivoRepository.findByPublicacion(publicacion.id);
        const yaExiste = existentes.some((item) => item.archivo_url === recursoUrl);
        if (!yaExiste) {
            await archivoRepository.create({
                publicacion_id: publicacion.id,
                tipo: archivo_tipo === "video" ? "video" : "imagen",
                archivo_url: recursoUrl,
                archivo_nombre: archivo_nombre?.trim() || publicacion.titulo,
                orden: existentes.length,
            });
        }
    }

    return (await publicacionRepository.findByIdWithIncludes(publicacion.id)) ?? publicacion;
};

export const setEstadoPublicacion = async (id: number, publicado?: boolean) => {
    assertValidId(id);

    const publicacion = await publicacionRepository.findById(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    const nuevoEstado =
        typeof publicado === "boolean" ? publicado : !publicacion.publicado;

    await publicacionRepository.update(publicacion, { publicado: nuevoEstado });
    return (await publicacionRepository.findByIdWithIncludes(publicacion.id)) ?? publicacion;
};

export const remove = async (id: number) => {
    assertValidId(id);

    const publicacion = await publicacionRepository.findById(id);
    if (!publicacion) throw notFoundError("Publicacion no encontrada");

    await archivoRepository.destroyByPublicacion(id);
    await publicacionRepository.destroy(publicacion);
};
