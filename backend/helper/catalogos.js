import { Estado } from "../models/estado.model.js";
import { Sector } from "../models/sector.model.js";

const findCatalogItem = async (Model, value) => {
    if (value === undefined || value === null || value === "") return null;

    const where = Number.isInteger(Number(value))
        ? { id: Number(value), activo: true }
        : { codigo: String(value).trim(), activo: true };

    return Model.findOne({ where });
};

export const findSector = (value) => findCatalogItem(Sector, value);
export const findEstado = (value) => findCatalogItem(Estado, value);