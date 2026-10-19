import type { Order } from "sequelize";
import { ArchivoPublicacion } from "../models/index.js";
import type { TipoArchivo } from "../models/archivoPublicacion.model.js";

const byOrdenAsc: Order = [["orden", "ASC"]];

export interface CreateArchivoData {
    publicacion_id: number;
    tipo?: TipoArchivo;
    archivo_url: string;
    archivo_nombre?: string | null;
    orden?: number;
}

export const findByPublicacion = (publicacionId: number) =>
    ArchivoPublicacion.findAll({
        where: { publicacion_id: publicacionId },
        order: byOrdenAsc,
    });

export const findById = (id: number) => ArchivoPublicacion.findByPk(id);

export const create = (data: CreateArchivoData) => ArchivoPublicacion.create(data);

export const destroyByPublicacion = (publicacionId: number) =>
    ArchivoPublicacion.destroy({ where: { publicacion_id: publicacionId } });

export const destroy = (archivo: ArchivoPublicacion) => archivo.destroy();
