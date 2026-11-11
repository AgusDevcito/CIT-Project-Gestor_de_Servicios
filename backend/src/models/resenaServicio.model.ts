import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { Servicio } from "./servicio.model.js";
import type { User } from "./user.model.js";

export class ResenaServicio extends Model<
    InferAttributes<ResenaServicio>,
    InferCreationAttributes<ResenaServicio>
> {
    declare id: CreationOptional<number>;
    declare servicio_id: number;
    declare user_id: number;
    declare calificacion: number;
    declare comentario: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare Servicio?: NonAttribute<Servicio>;
    declare Autor?: NonAttribute<User>;
}

ResenaServicio.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        servicio_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        calificacion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        comentario: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { len: [10, 1000] },
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        modelName: "ResenaServicio",
        tableName: "ResenaServicios",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["servicio_id", "user_id"],
            },
        ],
    },
);
