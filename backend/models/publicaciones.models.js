import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./user.models.js";
import { ArchivoPublicacion } from "./ArchivoPublicacion.models.js";
import { Sector } from "./sector.model.js";
export const Publicaciones = sequelize.define("Publicaciones",{
    titulo:{type:DataTypes.STRING(100),allowNull:false},
    contenido:{type:DataTypes.TEXT,allowNull:false},
    tipo_contenido:{type:DataTypes.ENUM("patologia","enfermedad","parasito","plaga","otro"),defaultValue:"enfermedad",allowNull:false},
    sector_id:{type:DataTypes.INTEGER,allowNull:false},
    author_id:{type:DataTypes.INTEGER,references:"User"}

},{
    timestamps:true,
})

//Relacion con usuario 
User.hasMany(Publicaciones,{foreignKey:"author_id",as:"Publicaciones"})
Publicaciones.belongsTo(User,{foreignKey:"author_id",as:"Autor"})
Sector.hasMany(Publicaciones,{foreignKey:"sector_id",as:"Publicaciones"})
Publicaciones.belongsTo(Sector,{foreignKey:"sector_id",as:"Sector"})

//Relacion con Archivo
Publicaciones.hasMany(ArchivoPublicacion,{foreignKey:"publicacion_id",as:"Archivo"})
ArchivoPublicacion.belongsTo(Publicaciones,{foreignKey:"publicacion_id", as:"Publicacion"})


