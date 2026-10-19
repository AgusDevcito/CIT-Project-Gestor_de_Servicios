import type { Includeable, Order } from "sequelize";
import { Estado, Propuesta, Sector, User } from "../models/index.js";

const includes: Includeable[] = [
    { model: User, as: "Solicitante", attributes: { exclude: ["password"] } },
    { model: Sector, as: "Sector" },
    { model: User, as: "Revisor", attributes: { exclude: ["password"] } },
];

const estadoInclude: Includeable = { model: Estado, as: "Estado" };
const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreatePropuestaData {
    titulo: string;
    sector_id: number;
    problematica: string;
    solicitante: number;
    estado_id: number;
}

export const create = (data: CreatePropuestaData) => Propuesta.create(data);

export const findPending = (estadoId: number) =>
    Propuesta.findAll({
        where: { estado_id: estadoId },
        include: [estadoInclude, ...includes],
        order: createdAtDesc,
    });

export const findByIdWithIncludes = (id: number) =>
    Propuesta.findByPk(id, { include: [estadoInclude, ...includes] });

export const save = (propuesta: Propuesta) => propuesta.save();
