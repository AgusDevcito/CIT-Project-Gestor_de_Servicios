import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { ArchivoPublicacion } from "./archivoPublicacion.model.js";
import type { Sector } from "./sector.model.js";
import type { User } from "./user.model.js";

export const TIPOS_CONTENIDO = ["patologia", "enfermedad", "parasito", "plaga", "otro"] as const;
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number];

export class Publicacion extends Model<InferAttributes<Publicacion>, InferCreationAttributes<Publicacion>> {
    declare id: CreationOptional<number>;
    declare titulo: string;
    declare contenido: string;
    declare tipo_contenido: CreationOptional<TipoContenido>;
    declare sector_id: number;
    declare author_id: CreationOptional<number | null>;

    declare Autor?: NonAttribute<User>;
    declare Archivo?: NonAttribute<ArchivoPublicacion[]>;
    declare Sector?: NonAttribute<Sector>;
}

Publicacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titulo: { type: DataTypes.STRING(100), allowNull: false },
        contenido: { type: DataTypes.TEXT, allowNull: false },
        tipo_contenido: {
            type: DataTypes.ENUM(...TIPOS_CONTENIDO),
            defaultValue: "enfermedad",
            allowNull: false,
        },
        sector_id: { type: DataTypes.INTEGER, allowNull: false },
        author_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        sequelize,
        modelName: "Publicaciones",
        tableName: "Publicaciones",
        timestamps: true,
    },
);
