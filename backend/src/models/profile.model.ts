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

export const TIPOS_PERFIL = ["PRODUCTOR", "ENTIDAD_COOPERATIVA"] as const;
export type TipoPerfil = (typeof TIPOS_PERFIL)[number];

export class Profile extends Model<InferAttributes<Profile>, InferCreationAttributes<Profile>> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare first_name: string;
    declare last_name: string;
    declare avatar_url: CreationOptional<string | null>;
    declare bio: CreationOptional<string | null>;
    declare tipo_perfil: CreationOptional<TipoPerfil>;
    declare razon_social: CreationOptional<string | null>;
    declare cuit: CreationOptional<string | null>;
    declare localidad: CreationOptional<string | null>;
    declare telefono_whatsapp: CreationOptional<string | null>;

    declare User?: NonAttribute<User>;
}

Profile.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        avatar_url: { type: DataTypes.STRING(250), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
        tipo_perfil: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: "PRODUCTOR",
        },
        razon_social: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        cuit: {
            type: DataTypes.STRING(30),
            allowNull: true,
            defaultValue: null,
        },
        localidad: {
            type: DataTypes.STRING(120),
            allowNull: true,
            defaultValue: null,
        },
        telefono_whatsapp: {
            type: DataTypes.STRING(40),
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: "Profile",
        tableName: "Profiles",
        timestamps: false,
    },
);
