import type { Includeable, Order, Transaction, WhereOptions } from "sequelize";
import { Estado, Profile, Propuesta, Sector, Servicio, User } from "../models/index.js";

const includes: Includeable[] = [
    {
        model: User,
        as: "Solicitante",
        attributes: { exclude: ["password"] },
        include: [{ model: Profile, as: "Profile" }],
    },
    { model: Sector, as: "Sector" },
    {
        model: User,
        as: "Revisor",
        attributes: { exclude: ["password"] },
        include: [{ model: Profile, as: "Profile" }],
    },
    {
        model: Servicio,
        as: "ServicioGenerado",
    },
];

const estadoInclude: Includeable = { model: Estado, as: "Estado" };
const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreatePropuestaData {
    titulo: string;
    sector_id: number;
    problematica: string;
    solicitante: number;
    estado_id: number;
    nombre_organismo?: string | null;
    email_contacto?: string | null;
    telefono_contacto?: string | null;
    bienes_recursos?: string | null;
    documento_url?: string | null;
    documento_nombre?: string | null;
}

export const create = (data: CreatePropuestaData) => Propuesta.create(data);

export const findAll = (where: WhereOptions = {}) =>
    Propuesta.findAll({
        where,
        include: [estadoInclude, ...includes],
        order: createdAtDesc,
    });

export const findPending = (estadoId: number) =>
    findAll({ estado_id: estadoId });

export const findByIdWithIncludes = (id: number, transaction?: Transaction) =>
    Propuesta.findByPk(id, {
        include: [estadoInclude, ...includes],
        transaction,
    });

export const findServicioByPropuestaId = (
    propuestaId: number,
    transaction?: Transaction,
) =>
    Servicio.findOne({
        where: { propuesta_id: propuestaId },
        transaction,
    });

export const findBySolicitante = (solicitanteId: number) =>
    findAll({ solicitante: solicitanteId });

export const findByDocumentoUrl = (documentoUrl: string) =>
    Propuesta.findOne({
        where: { documento_url: documentoUrl },
    });

export const save = (propuesta: Propuesta, transaction?: Transaction) =>
    propuesta.save({ transaction });
