import type { Includeable, Order } from "sequelize";
import { Sector, Servicio, User } from "../models/index.js";

const includes: Includeable[] = [
    { model: User, as: "Proveedor", attributes: { exclude: ["password"] } },
    { model: Sector, as: "Sector" },
];

const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreateServicioData {
    servicio_nombre: string;
    servicio_description: string;
    servicio_img?: string | null;
    servicio_precio: number;
    sector_id: number;
    proveedor_id: number;
}

export const findAll = () =>
    Servicio.findAll({ include: includes, order: createdAtDesc });

export const create = (data: CreateServicioData) => Servicio.create(data);
