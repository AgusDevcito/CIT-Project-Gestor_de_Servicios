import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { Sector } from "./sector.model.js";
import type { Solicitud } from "./solicitud.model.js";
import type { User } from "./user.model.js";

export class Servicio extends Model<InferAttributes<Servicio>, InferCreationAttributes<Servicio>> {
    declare id: CreationOptional<number>;
    declare servicio_nombre: string;
    declare servicio_description: string;
    declare servicio_img: CreationOptional<string | null>;
    declare sector_id: number;
    declare servicio_precio: number;
    declare proveedor_id: number;

    declare Proveedor?: NonAttribute<User>;
    declare Sector?: NonAttribute<Sector>;
    declare Solicitudes?: NonAttribute<Solicitud[]>;
}

Servicio.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        servicio_nombre: { type: DataTypes.STRING(30), allowNull: false },
        servicio_description: { type: DataTypes.STRING(350), allowNull: false },
        servicio_img: { type: DataTypes.STRING, allowNull: true },
        sector_id: { type: DataTypes.INTEGER, allowNull: false },
        servicio_precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        sequelize,
        modelName: "Servicios",
        tableName: "Servicios",
    },
);
