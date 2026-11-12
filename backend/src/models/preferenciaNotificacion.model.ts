import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import type { User } from "./user.model.js";

export const DEFAULT_PREFERENCIAS_NOTIFICACION = {
    noticias_publicaciones: true,
    cambios_propuestas: true,
    nuevos_servicios: true,
    actualizaciones_plataforma: true,
    actividad_usuario: true,
} as const;

export class PreferenciaNotificacion extends Model<
    InferAttributes<PreferenciaNotificacion>,
    InferCreationAttributes<PreferenciaNotificacion>
> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare noticias_publicaciones: CreationOptional<boolean>;
    declare cambios_propuestas: CreationOptional<boolean>;
    declare nuevos_servicios: CreationOptional<boolean>;
    declare actualizaciones_plataforma: CreationOptional<boolean>;
    declare actividad_usuario: CreationOptional<boolean>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare User?: NonAttribute<User>;
}

PreferenciaNotificacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        noticias_publicaciones: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCIAS_NOTIFICACION.noticias_publicaciones,
        },
        cambios_propuestas: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCIAS_NOTIFICACION.cambios_propuestas,
        },
        nuevos_servicios: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCIAS_NOTIFICACION.nuevos_servicios,
        },
        actualizaciones_plataforma: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCIAS_NOTIFICACION.actualizaciones_plataforma,
        },
        actividad_usuario: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCIAS_NOTIFICACION.actividad_usuario,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: "PreferenciaNotificacion",
        tableName: "PreferenciasNotificaciones",
        timestamps: true,
        indexes: [
            {
                unique: true,
                name: "uq_preferencias_notificaciones_user_id",
                fields: ["user_id"],
            },
        ],
    },
);
