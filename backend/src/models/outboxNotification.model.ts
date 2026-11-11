import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export class OutboxNotification extends Model<InferAttributes<OutboxNotification>, InferCreationAttributes<OutboxNotification>> {
    declare id: CreationOptional<number>;
    declare recipient: string;
    declare subject: string;
    declare body: string;
    declare status: "PENDING" | "SENT" | "FAILED"; // simple enum
    declare attempts: CreationOptional<number>;
    declare createdAt: Date;
    declare updatedAt: Date;
}

OutboxNotification.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        recipient: { type: DataTypes.STRING, allowNull: false },
        subject: { type: DataTypes.STRING, allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "SENT", "FAILED"), allowNull: false, defaultValue: "PENDING" },
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: "OutboxNotification",
        tableName: "OutboxNotifications",
        timestamps: true,
    },
);

export default OutboxNotification;
