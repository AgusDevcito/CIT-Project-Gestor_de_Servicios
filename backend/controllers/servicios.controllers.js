import { Servicios } from "../models/servicios.models.js";
import { User } from "../models/user.models.js";
import { Sector } from "../models/sector.model.js";
import { findSector } from "../helper/catalogos.js";

const serviceIncludes = [
    { model: User, as: "Proveedor", attributes: { exclude: ["password"] } },
    { model: Sector, as: "Sector" },
];

export const getServicios = async (_req, res) => {
    const data = await Servicios.findAll({ include: serviceIncludes, order: [["createdAt", "DESC"]] });
    return res.json({ count: data.length, data });
};

export const createServicio = async (req, res) => {
    const { servicio_nombre, servicio_description, servicio_img, servicio_precio, sector_id: requestedSector, sector } = req.body;
    const sectorItem = await findSector(requestedSector ?? sector);

    if (!servicio_nombre || !servicio_description || servicio_precio === undefined || !sectorItem) {
        return res.status(400).json({ msg: "Nombre, descripción, precio y sector válido son obligatorios." });
    }

    const servicio = await Servicios.create({
        servicio_nombre,
        servicio_description,
        servicio_img,
        servicio_precio,
        sector_id: sectorItem.id,
        proveedor_id: req.user.id,
    });
    return res.status(201).json({ data: servicio });
};