import { validationError } from "../errors/AppError.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import type { CatalogoTipo } from "../repositories/catalog.repository.js";

export const list = (type: CatalogoTipo) => catalogRepository.listActive(type);

export const create = (
    type: CatalogoTipo,
    input: { codigo?: string; nombre?: string },
) => {
    const codigo = input.codigo?.trim();
    const nombre = input.nombre?.trim();

    if (!codigo || !nombre) {
        throw validationError("codigo y nombre son obligatorios.");
    }

    return catalogRepository.createItem(type, { codigo, nombre });
};
