import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from "sequelize";
import { sequelize } from "../config/db.js";

export const CIT_APPLICATION_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;
export type CitApplicationStatus = (typeof CIT_APPLICATION_STATUS)[keyof typeof CIT_APPLICATION_STATUS];

export class CitApplication extends Model<InferAttributes<CitApplication>, InferCreationAttributes<CitApplication>> {
    declare id: CreationOptional<number>;
    declare first_name: string;
    declare last_name: string;
    declare dni: string;
    declare email: string;
    declare dni_front_path: string;
    declare dni_back_path: string;
    declare status: CitApplicationStatus;
    declare reviewed_by?: number | null; // FK to User (admin)
    declare reviewed_at?: Date | null;
    declare rejection_reason?: string | null;
    // timestamps
    declare createdAt: Date;
    declare updatedAt: Date;

    // Associations (optional)
    declare Reviewer?: NonAttribute<any>;
}

CitApplication.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        dni: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        dni_front_path: { type: DataTypes.STRING, allowNull: false },
        dni_back_path: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.ENUM(...Object.values(CIT_APPLICATION_STATUS)), allowNull: false, defaultValue: CIT_APPLICATION_STATUS.PENDING },
        reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
        reviewed_at: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: "CitApplication",
        tableName: "CitApplications",
        timestamps: true,
        createdAt: true,
        updatedAt: true,
    },
);

export default CitApplication;
