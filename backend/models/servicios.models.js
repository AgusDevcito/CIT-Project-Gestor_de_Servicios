import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./user.models.js";
import { Sector } from "./sector.model.js";



export const Servicios = sequelize.define("Servicios",{
    servicio_nombre:{type:DataTypes.STRING(30),allowNull:false},
    servicio_description:{type:DataTypes.STRING(350),allowNull:false},
    servicio_img:{type:DataTypes.STRING(),allowNull:true},
    sector_id:{type:DataTypes.INTEGER,allowNull:false},
    servicio_precio:{type:DataTypes.DECIMAL(10, 2),allowNull:false},
    proveedor_id:{type:DataTypes.INTEGER,allowNull:false},
})
User.hasMany(Servicios,{foreignKey:"proveedor_id",as:"ServiciosOfrecidos"})
Servicios.belongsTo(User,{foreignKey:"proveedor_id",as:"Proveedor"})
Sector.hasMany(Servicios,{foreignKey:"sector_id",as:"Servicios"})
Servicios.belongsTo(Sector,{foreignKey:"sector_id",as:"Sector"})
