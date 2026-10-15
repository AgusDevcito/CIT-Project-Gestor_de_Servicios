import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./user.models.js";
import { Sector } from "./sector.model.js";
import { Estado } from "./estado.model.js";

export const Propuestas = sequelize.define("Propuesta",{
    titulo:{type:DataTypes.STRING,allowNull:false,validate:{msg:"La propuesta debe tener un titulo"}},
    sector_id:{type:DataTypes.INTEGER,allowNull:false},
    problematica:{type:DataTypes.TEXT,allowNull:false,validate:{
        len:[20,5000],
    }},
    estado_id:{type:DataTypes.INTEGER,allowNull:false},
    solicitante:{type:DataTypes.INTEGER,allowNull:false},
    cirRevisorId:{type:DataTypes.INTEGER,defaultValue:null},
    citJustificacion:{type:DataTypes.TEXT,defaultValue:null},
    citFechaRevision:{type:DataTypes.DATE,defaultValue:null},   
},{
    timestamps:true,
}
)

// Una propuesta pertenece al usuario que la solicita.
User.hasMany(Propuestas,{foreignKey:"solicitante",as:"PropuestasSolicitadas"})
Propuestas.belongsTo(User,{foreignKey:"solicitante",as:"Solicitante"})

// Una propuesta tambien puede guardar el usuario CIT que la reviso.
User.hasMany(Propuestas,{foreignKey:"cirRevisorId",as:"PropuestasRevisadas"})
Propuestas.belongsTo(User,{foreignKey:"cirRevisorId",as:"Revisor"})
Sector.hasMany(Propuestas,{foreignKey:"sector_id",as:"Propuestas"})
Propuestas.belongsTo(Sector,{foreignKey:"sector_id",as:"Sector"})
Estado.hasMany(Propuestas,{foreignKey:"estado_id",as:"Propuestas"})
Propuestas.belongsTo(Estado,{foreignKey:"estado_id",as:"Estado"})
