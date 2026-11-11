import { validationError } from "../errors/AppError.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import type { CatalogoTipo } from "../repositories/catalog.repository.js";
import { seedCatalogos } from "./catalogSeed.service.js";

export const list = async (type: CatalogoTipo) => {
    const items = await catalogRepository.listActive(type);
    if (items.length > 0) {
        return items;
    }
    await seedCatalogos();
    return catalogRepository.listActive(type);
};

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
