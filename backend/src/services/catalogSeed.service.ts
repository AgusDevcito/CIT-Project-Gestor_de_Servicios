import * as catalogRepository from "../repositories/catalog.repository.js";

const SECTORES: ReadonlyArray<readonly [string, string]> = [
    ["AGRICOLA", "Agrícola"],
    ["GANADERO", "Ganadero"],
    ["FRUTIHORTICOLA", "Frutihortícola"],
];

const ESTADOS: ReadonlyArray<readonly [string, string]> = [
    ["PENDIENTE", "Pendiente"],
    ["APROBADO", "Aprobado"],
    ["RECHAZADO", "Rechazado"],
    ["ACEPTADA", "Aceptada"],
    ["FINALIZADA", "Finalizada"],
];

export const seedCatalogos = async (): Promise<void> => {
    for (const [codigo, nombre] of SECTORES) {
        await catalogRepository.upsertSector(codigo, nombre);
    }

    for (const [codigo, nombre] of ESTADOS) {
        await catalogRepository.upsertEstado(codigo, nombre);
    }
};
