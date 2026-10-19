import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";
import { sequelize } from "../config/db.js";

export class Sector extends Model<InferAttributes<Sector>, InferCreationAttributes<Sector>> {
    declare id: CreationOptional<number>;
    declare codigo: string;
    declare nombre: string;
    declare activo: CreationOptional<boolean>;
}

Sector.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
        nombre: { type: DataTypes.STRING(80), allowNull: false },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
        sequelize,
        modelName: "Sector",
        tableName: "Sectors",
        timestamps: false,
    },
);
