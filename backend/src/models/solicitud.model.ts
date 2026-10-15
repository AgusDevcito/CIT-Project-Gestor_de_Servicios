import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { Estado } from "./estado.model.js";
import type { Servicio } from "./servicio.model.js";
import type { User } from "./user.model.js";

export class Solicitud extends Model<InferAttributes<Solicitud>, InferCreationAttributes<Solicitud>> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare servicio_id: number;
    declare estado_id: number;
    declare fecha_solicitud: CreationOptional<Date>;

    declare Solicitante?: NonAttribute<User>;
    declare Servicio?: NonAttribute<Servicio>;
    declare Estado?: NonAttribute<Estado>;
}

Solicitud.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        servicio_id: { type: DataTypes.INTEGER, allowNull: false },
        estado_id: { type: DataTypes.INTEGER, allowNull: false },
        fecha_solicitud: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: "Solicitud",
        tableName: "Solicituds",
        timestamps: true,
    },
);
