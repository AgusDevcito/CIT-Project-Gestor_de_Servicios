import { Op, type Includeable, type Order, type WhereOptions } from "sequelize";
import { ArchivoPublicacion, Profile, Publicacion, Sector, User } from "../models/index.js";
import type { TipoContenido } from "../models/publicacion.model.js";

const includes: Includeable[] = [
    {
        model: User,
        as: "Autor",
        attributes: { exclude: ["password"] },
        include: [{ model: Profile, as: "Profile" }],
    },
    { model: ArchivoPublicacion, as: "Archivo" },
    { model: Sector, as: "Sector" },
];

const createdAtDesc: Order = [["createdAt", "DESC"]];

export interface CreatePublicacionData {
    titulo: string;
    contenido: string;
    tipo_contenido?: TipoContenido;
    sector_id: number;
    author_id: number;
    publicado?: boolean;
}

export interface FindPublicacionesOptions {
    includeDrafts?: boolean;
}

export const findAll = (options: FindPublicacionesOptions = {}) => {
    const where: WhereOptions | undefined = options.includeDrafts
        ? undefined
        : {
              [Op.or]: [{ publicado: true }, { publicado: null as unknown as boolean }],
          };

    return Publicacion.findAll({
        where,
        include: includes,
        order: createdAtDesc,
    });
};

export const findByIdWithIncludes = (id: number) =>
    Publicacion.findByPk(id, { include: includes });

export const findById = (id: number) => Publicacion.findByPk(id);

export const create = (data: CreatePublicacionData) => Publicacion.create(data);

export const update = (
    publicacion: Publicacion,
    data: {
        titulo?: string;
        contenido?: string;
        tipo_contenido?: TipoContenido;
        sector_id?: number;
        publicado?: boolean;
    },
) => publicacion.update(data);

export const destroy = (publicacion: Publicacion) => publicacion.destroy();
