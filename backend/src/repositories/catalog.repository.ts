import type { Order } from "sequelize";
import { Estado, Sector } from "../models/index.js";
import type { EstadoCodigo } from "../constants/estados.js";

export type CatalogoTipo = "sectores" | "estados";

const byNameAsc: Order = [["nombre", "ASC"]];

const buildCatalogWhere = (value: unknown) =>
    Number.isInteger(Number(value))
        ? { id: Number(value), activo: true }
        : { codigo: String(value).trim(), activo: true };

export const findSector = async (value: unknown): Promise<Sector | null> => {
    if (value === undefined || value === null || value === "") return null;
    return Sector.findOne({ where: buildCatalogWhere(value) });
};

export const findEstado = async (value: unknown): Promise<Estado | null> => {
    if (value === undefined || value === null || value === "") return null;
    return Estado.findOne({ where: buildCatalogWhere(value) });
};

export const findEstadoByCodigo = (codigo: EstadoCodigo) => findEstado(codigo);

export const listActive = (type: CatalogoTipo) =>
    type === "estados"
        ? Estado.findAll({ where: { activo: true }, order: byNameAsc })
        : Sector.findAll({ where: { activo: true }, order: byNameAsc });

export const createItem = (type: CatalogoTipo, data: { codigo: string; nombre: string }) =>
    type === "estados" ? Estado.create(data) : Sector.create(data);

export const upsertSector = (codigo: string, nombre: string) =>
    Sector.findOrCreate({ where: { codigo }, defaults: { codigo, nombre } });

export const upsertEstado = (codigo: string, nombre: string) =>
    Estado.findOrCreate({ where: { codigo }, defaults: { codigo, nombre } });
