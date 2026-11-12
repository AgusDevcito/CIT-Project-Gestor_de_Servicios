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

export const TIPOS_NOTIFICACION = [
    "NUEVA_PUBLICACION",
    "CAMBIO_ESTADO_PROPUESTA",
    "NUEVO_SERVICIO",
    "ACTUALIZACION_PLATAFORMA",
    "ACTIVIDAD_USUARIO",
] as const;

export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export const REFERENCIAS_NOTIFICACION = [
    "publicacion",
    "propuesta",
    "servicio",
    "solicitud",
    "sistema",
] as const;

export type ReferenciaNotificacion = (typeof REFERENCIAS_NOTIFICACION)[number];

export class Notificacion extends Model<
    InferAttributes<Notificacion>,
    InferCreationAttributes<Notificacion>
> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare tipo: TipoNotificacion;
    declare titulo: string;
    declare mensaje: string;
    declare enlace: CreationOptional<string | null>;
    declare referencia_tipo: CreationOptional<ReferenciaNotificacion | string | null>;
    declare referencia_id: CreationOptional<number | null>;
    declare leida: CreationOptional<boolean>;
    declare fecha_lectura: CreationOptional<Date | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare Destinatario?: NonAttribute<User>;
}

Notificacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        tipo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [TIPOS_NOTIFICACION],
            },
        },
        titulo: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        enlace: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        referencia_tipo: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
        },
        referencia_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        leida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        fecha_lectura: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
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
        modelName: "Notificacion",
        tableName: "Notificaciones",
        timestamps: true,
        indexes: [
            {
                name: "idx_notificaciones_user_leida_created",
                fields: ["user_id", "leida", { name: "createdAt", order: "DESC" }],
            },
        ],
    },
);
