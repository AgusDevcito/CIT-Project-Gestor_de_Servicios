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

export class Profile extends Model<InferAttributes<Profile>, InferCreationAttributes<Profile>> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare first_name: string;
    declare last_name: string;
    declare avatar_url: CreationOptional<string | null>;

    declare User?: NonAttribute<User>;
}

Profile.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        avatar_url: { type: DataTypes.STRING(250), allowNull: true },
    },
    {
        sequelize,
        modelName: "Profile",
        tableName: "Profiles",
        timestamps: false,
    },
);
