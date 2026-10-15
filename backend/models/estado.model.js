import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Estado = sequelize.define("Estado", {
    codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { timestamps: false });