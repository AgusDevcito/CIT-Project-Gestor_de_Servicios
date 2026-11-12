import * as catalogRepository from "../repositories/catalog.repository.js";

const SECTORES: ReadonlyArray<readonly [string, string]> = [
    ["AGRICOLA", "Agrícola"],
    ["GANADERO", "Ganadero"],
    ["FRUTIHORTICOLA", "Frutihortícola"],
];

const ESTADOS: ReadonlyArray<readonly [string, string]> = [
    ["PENDIENTE", "Pendiente"],
    ["EN_REVISION", "En revisión"],
    ["APROBADO", "Aprobado"],
    ["RECHAZADO", "Rechazado"],
    ["ACEPTADA", "Aceptada"],
    ["FINALIZADA", "Finalizada"],
    ["CANCELADA", "Cancelada"],
];

/**
 * Inicializa únicamente el catálogo funcional base (Sectores y Estados) de forma idempotente.
 * No ejecuta sentencias DDL ni modificaciones estructurales de esquema durante el arranque:
 * la creación de tablas, columnas, índices, claves foráneas y el backfill de preferencias
 * para usuarios existentes son responsabilidad exclusiva de las migraciones versionadas.
 */
export const seedCatalogos = async (): Promise<void> => {
    for (const [codigo, nombre] of SECTORES) {
        await catalogRepository.upsertSector(codigo, nombre);
    }

    for (const [codigo, nombre] of ESTADOS) {
        await catalogRepository.upsertEstado(codigo, nombre);
    }
};

export const ensureCatalogSeed = seedCatalogos;
