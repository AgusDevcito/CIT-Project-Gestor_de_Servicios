import type { Includeable, Order, Transaction } from "sequelize";
import { sequelize } from "../config/db.js";
import {
    Profile,
    Propuesta,
    ResenaServicio,
    Sector,
    Servicio,
    Solicitud,
    User,
} from "../models/index.js";

const baseIncludes: Includeable[] = [
    {
        model: User,
        as: "Proveedor",
        attributes: { exclude: ["password"] },
        include: [{ model: Profile, as: "Profile" }],
    },
    { model: Sector, as: "Sector" },
];

const resenasInclude: Includeable = {
    model: ResenaServicio,
    as: "Resenas",
    include: [
        {
            model: User,
            as: "Autor",
            attributes: { exclude: ["password"] },
            include: [{ model: Profile, as: "Profile" }],
        },
    ],
};

const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreateServicioData {
    servicio_nombre: string;
    servicio_description: string;
    servicio_img?: string | null;
    servicio_precio: number;
    sector_id: number;
    proveedor_id: number;
}

export interface CreateResenaData {
    servicio_id: number;
    user_id: number;
    calificacion: number;
    comentario: string;
}

export const findAll = async () => {
    try {
        return await Servicio.findAll({
            include: [...baseIncludes, resenasInclude],
            order: createdAtDesc,
        });
    } catch {
        return Servicio.findAll({
            include: baseIncludes,
            order: createdAtDesc,
        });
    }
};

export const findById = async (id: number) => {
    try {
        return await Servicio.findByPk(id, {
            include: [...baseIncludes, resenasInclude],
        });
    } catch {
        return Servicio.findByPk(id, {
            include: baseIncludes,
        });
    }
};

export const create = (data: CreateServicioData) => Servicio.create(data);

export const deleteById = async (id: number) => {
    return sequelize.transaction(async (transaction: Transaction) => {
        await ResenaServicio.destroy({ where: { servicio_id: id }, transaction });
        await Solicitud.destroy({ where: { servicio_id: id }, transaction });
        await Propuesta.update(
            { servicio_generado_id: null },
            { where: { servicio_generado_id: id }, transaction },
        );
        const deletedCount = await Servicio.destroy({ where: { id }, transaction });
        return deletedCount > 0;
    });
};

export const findResenaByUserAndServicio = (
    servicioId: number,
    userId: number,
) =>
    ResenaServicio.findOne({
        where: { servicio_id: servicioId, user_id: userId },
    });

export const createResena = async (data: CreateResenaData) => {
    const creada = await ResenaServicio.create(data);
    return ResenaServicio.findByPk(creada.id, {
        include: [
            {
                model: User,
                as: "Autor",
                attributes: { exclude: ["password"] },
                include: [{ model: Profile, as: "Profile" }],
            },
        ],
    });
};
