import type { Includeable, Order, WhereOptions } from "sequelize";
import { Estado, Profile, Sector, Servicio, Solicitud, User } from "../models/index.js";

const includes: Includeable[] = [
    {
        model: Servicio,
        as: "Servicio",
        include: [{ model: Sector, as: "Sector" }],
    },
    { model: Estado, as: "Estado" },
    {
        model: User,
        as: "Solicitante",
        attributes: { exclude: ["password"] },
        include: [{ model: Profile, as: "Profile" }],
    },
];

const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreateSolicitudData {
    user_id: number;
    servicio_id: number;
    estado_id: number;
    beneficiario_nombre?: string | null;
    beneficiario_dni_cuit?: string | null;
    beneficiario_localidad?: string | null;
}

export const findAll = (where: WhereOptions) =>
    Solicitud.findAll({ where, include: includes, order: createdAtDesc });

export const findById = (id: number) =>
    Solicitud.findByPk(id, { include: includes });

export const findByResultadoUrl = (resultadoArchivoUrl: string) =>
    Solicitud.findOne({
        where: { resultado_archivo_url: resultadoArchivoUrl },
        include: includes,
    });

export const create = (data: CreateSolicitudData) => Solicitud.create(data);

export const save = (solicitud: Solicitud) => solicitud.save();

export const deleteById = (id: number) => Solicitud.destroy({ where: { id } });
