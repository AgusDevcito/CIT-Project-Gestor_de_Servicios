import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./user.models.js";
import { Servicios } from "./servicios.models.js";
import { Estado } from "./estado.model.js";


export const Solicitud = sequelize.define("Solicitud",{
    user_id:{type:DataTypes.INTEGER,allowNull:false},
    servicio_id:{type:DataTypes.INTEGER,allowNull:false},
    estado_id:{type:DataTypes.INTEGER,allowNull:false},
    fecha_solicitud:{type:DataTypes.DATE,allowNull:false,defaultValue:DataTypes.NOW},
}, {
    timestamps: true,
});

User.hasMany(Solicitud,{foreignKey:"user_id",as:"Solicitudes"});
Solicitud.belongsTo(User,{foreignKey:"user_id",as:"Solicitante"});
Servicios.hasMany(Solicitud,{foreignKey:"servicio_id",as:"Solicitudes"});   
Solicitud.belongsTo(Servicios,{foreignKey:"servicio_id",as:"Servicio"});
Estado.hasMany(Solicitud,{foreignKey:"estado_id",as:"Solicitudes"});
Solicitud.belongsTo(Estado,{foreignKey:"estado_id",as:"Estado"});