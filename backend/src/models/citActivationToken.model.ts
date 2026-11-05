import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export class CitActivationToken extends Model<InferAttributes<CitActivationToken>, InferCreationAttributes<CitActivationToken>> {
    declare id: CreationOptional<number>;
    declare user_id: number; // FK to User
    declare token_hash: string; // bcrypt hash of token
    declare expires_at: Date;
    declare used_at: Date | null;
    // timestamps
    declare createdAt: Date;
    declare updatedAt: Date;
}

CitActivationToken.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        token_hash: { type: DataTypes.STRING, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        used_at: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: "CitActivationToken",
        tableName: "CitActivationTokens",
        timestamps: true,
    },
);

export default CitActivationToken;
