import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { Publicacion } from "./publicacion.model.js";

export const TIPOS_ARCHIVO = ["imagen", "video"] as const;
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number];

export class ArchivoPublicacion extends Model<
    InferAttributes<ArchivoPublicacion>,
    InferCreationAttributes<ArchivoPublicacion>
> {
    declare id: CreationOptional<number>;
    declare tipo: CreationOptional<TipoArchivo>;
    declare archivo_url: string;
    declare archivo_nombre: CreationOptional<string | null>;
    declare orden: CreationOptional<number>;
    declare publicacion_id: CreationOptional<number>;

    declare Publicacion?: NonAttribute<Publicacion>;
}

ArchivoPublicacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tipo: {
            type: DataTypes.ENUM(...TIPOS_ARCHIVO),
            defaultValue: "imagen",
            allowNull: false,
        },
        archivo_url: { type: DataTypes.STRING, allowNull: false },
        archivo_nombre: { type: DataTypes.STRING, allowNull: true },
        orden: { type: DataTypes.INTEGER, defaultValue: 0 },
        publicacion_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        sequelize,
        modelName: "Archivos",
        tableName: "Archivos",
        timestamps: false,
    },
);
