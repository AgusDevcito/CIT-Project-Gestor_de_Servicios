import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { Propuesta } from "./propuesta.model.js";
import type { Solicitud } from "./solicitud.model.js";

export class Estado extends Model<InferAttributes<Estado>, InferCreationAttributes<Estado>> {
    declare id: CreationOptional<number>;
    declare codigo: string;
    declare nombre: string;
    declare activo: CreationOptional<boolean>;

    declare Propuestas?: NonAttribute<Propuesta[]>;
    declare Solicitudes?: NonAttribute<Solicitud[]>;
}

Estado.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
        nombre: { type: DataTypes.STRING(80), allowNull: false },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
        sequelize,
        modelName: "Estado",
        tableName: "Estados",
        timestamps: false,
    },
);
