import { Estado } from "../models/estado.model.js";
import { Sector } from "../models/sector.model.js";

const catalogModel = (type) => type === "estados" ? Estado : Sector;

export const getCatalog = (type) => async (_req, res) => {
    const Model = catalogModel(type);
    const data = await Model.findAll({ where: { activo: true }, order: [["nombre", "ASC"]] });
    return res.json({ count: data.length, data });
};

export const createCatalogItem = (type) => async (req, res) => {
    const Model = catalogModel(type);
    const { codigo, nombre } = req.body;

    if (!codigo?.trim() || !nombre?.trim()) {
        return res.status(400).json({ msg: "codigo y nombre son obligatorios." });
    }

    const item = await Model.create({ codigo: codigo.trim(), nombre: nombre.trim() });
    return res.status(201).json({ data: item });
};