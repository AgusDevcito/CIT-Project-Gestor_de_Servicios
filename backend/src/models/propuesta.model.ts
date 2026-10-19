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
import type { Sector } from "./sector.model.js";
import type { User } from "./user.model.js";

export class Propuesta extends Model<InferAttributes<Propuesta>, InferCreationAttributes<Propuesta>> {
    declare id: CreationOptional<number>;
    declare titulo: string;
    declare sector_id: number;
    declare problematica: string;
    declare estado_id: number;
    declare solicitante: number;
    declare cirRevisorId: CreationOptional<number | null>;
    declare citJustificacion: CreationOptional<string | null>;
    declare citFechaRevision: CreationOptional<Date | null>;

    declare Solicitante?: NonAttribute<User>;
    declare Revisor?: NonAttribute<User>;
    declare Sector?: NonAttribute<Sector>;
    declare Estado?: NonAttribute<Estado>;
}

Propuesta.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titulo: { type: DataTypes.STRING, allowNull: false },
        sector_id: { type: DataTypes.INTEGER, allowNull: false },
        problematica: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { len: [20, 5000] },
        },
        estado_id: { type: DataTypes.INTEGER, allowNull: false },
        solicitante: { type: DataTypes.INTEGER, allowNull: false },
        cirRevisorId: { type: DataTypes.INTEGER, defaultValue: null },
        citJustificacion: { type: DataTypes.TEXT, defaultValue: null },
        citFechaRevision: { type: DataTypes.DATE, defaultValue: null },
    },
    {
        sequelize,
        modelName: "Propuesta",
        tableName: "Propuesta",
        timestamps: true,
    },
);
