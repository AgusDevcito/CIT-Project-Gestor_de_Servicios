import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";
import { ROL, ROLES } from "../constants/roles.js";
import type { Rol } from "../constants/roles.js";
import type { Profile } from "./profile.model.js";
import type { Publicacion } from "./publicacion.model.js";
import type { Propuesta } from "./propuesta.model.js";
import type { Servicio } from "./servicio.model.js";
import type { Solicitud } from "./solicitud.model.js";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare username: string;
    declare email: string;
    declare password: string;
    declare role: CreationOptional<Rol>;
    declare document_url: CreationOptional<string | null>;
    declare document_name: CreationOptional<string | null>;

    declare Profile?: NonAttribute<Profile>;
    declare ServiciosOfrecidos?: NonAttribute<Servicio[]>;
    declare Publicaciones?: NonAttribute<Publicacion[]>;
    declare PropuestasSolicitadas?: NonAttribute<Propuesta[]>;
    declare PropuestasRevisadas?: NonAttribute<Propuesta[]>;
    declare Solicitudes?: NonAttribute<Solicitud[]>;
}

User.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM(...ROLES), defaultValue: ROL.USER },
        document_url: { type: DataTypes.STRING, allowNull: true },
        document_name: { type: DataTypes.STRING, allowNull: true },
    },
    {
        sequelize,
        modelName: "User",
        tableName: "Users",
        timestamps: false,
    },
);
