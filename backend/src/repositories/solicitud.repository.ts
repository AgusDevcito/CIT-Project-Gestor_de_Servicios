import type { Order, WhereOptions } from "sequelize";
import { Estado, Servicio, Solicitud } from "../models/index.js";

const includes = [
    { model: Servicio, as: "Servicio" },
    { model: Estado, as: "Estado" },
];

const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreateSolicitudData {
    user_id: number;
    servicio_id: number;
    estado_id: number;
}

export const findAll = (where: WhereOptions) =>
    Solicitud.findAll({ where, include: includes, order: createdAtDesc });

export const findById = (id: number) => Solicitud.findByPk(id);

export const create = (data: CreateSolicitudData) => Solicitud.create(data);

export const save = (solicitud: Solicitud) => solicitud.save();
