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
import type { User } from "./user.model.js";

export const ESTADOS_INSCRIPCION = ["INSCRIPTO", "EN_CURSO", "FINALIZADO"] as const;
export type EstadoInscripcion = (typeof ESTADOS_INSCRIPCION)[number];

export class InscripcionCapacitacion extends Model<
    InferAttributes<InscripcionCapacitacion>,
    InferCreationAttributes<InscripcionCapacitacion>
> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare publicacion_id: number;
    declare estado: CreationOptional<EstadoInscripcion>;
    declare observaciones: CreationOptional<string | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare Participante?: NonAttribute<User>;
    declare Publicacion?: NonAttribute<Publicacion>;
}

InscripcionCapacitacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        publicacion_id: { type: DataTypes.INTEGER, allowNull: false },
        estado: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "INSCRIPTO",
        },
        observaciones: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: "InscripcionCapacitacion",
        tableName: "InscripcionesCapacitaciones",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["user_id", "publicacion_id"],
                name: "inscripcion_capacitacion_user_pub_unique",
            },
        ],
    },
);
