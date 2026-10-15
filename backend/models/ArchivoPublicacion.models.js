import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const ArchivoPublicacion = sequelize.define("Archivos",{
    tipo:{type:DataTypes.ENUM("imagen","video"),defaultValue:"imagen",allowNull:false},
    archivo_url:{type:DataTypes.STRING,allowNull:false},
    archivo_nombre:{type:DataTypes.STRING},
    orden:{type:DataTypes.INTEGER,defaultValue:0}
},{
    timestamps:false,
})

