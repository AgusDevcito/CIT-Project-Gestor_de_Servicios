import { ArchivoPublicacion } from "./archivoPublicacion.model.js";
import { Estado } from "./estado.model.js";
import { Profile } from "./profile.model.js";
import { Propuesta } from "./propuesta.model.js";
import { Publicacion } from "./publicacion.model.js";
import { Sector } from "./sector.model.js";
import { Servicio } from "./servicio.model.js";
import { Solicitud } from "./solicitud.model.js";
import { User } from "./user.model.js";

// Las asociaciones se registran una sola vez, en un unico lugar.
// Antes cada archivo de modelo importaba a los demas y definia relaciones como
// efecto secundario del import; ahora los modelos son independientes entre si.
export const registerAssociations = (): void => {
    User.hasOne(Profile, { foreignKey: "user_id", as: "Profile" });
    Profile.belongsTo(User, { foreignKey: "user_id", as: "User" });

    User.hasMany(Servicio, { foreignKey: "proveedor_id", as: "ServiciosOfrecidos" });
    Servicio.belongsTo(User, { foreignKey: "proveedor_id", as: "Proveedor" });
    Sector.hasMany(Servicio, { foreignKey: "sector_id", as: "Servicios" });
    Servicio.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });

    User.hasMany(Propuesta, { foreignKey: "solicitante", as: "PropuestasSolicitadas" });
    Propuesta.belongsTo(User, { foreignKey: "solicitante", as: "Solicitante" });
    User.hasMany(Propuesta, { foreignKey: "cirRevisorId", as: "PropuestasRevisadas" });
    Propuesta.belongsTo(User, { foreignKey: "cirRevisorId", as: "Revisor" });
    Sector.hasMany(Propuesta, { foreignKey: "sector_id", as: "Propuestas" });
    Propuesta.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });
    Estado.hasMany(Propuesta, { foreignKey: "estado_id", as: "Propuestas" });
    Propuesta.belongsTo(Estado, { foreignKey: "estado_id", as: "Estado" });

    User.hasMany(Publicacion, { foreignKey: "author_id", as: "Publicaciones" });
    Publicacion.belongsTo(User, { foreignKey: "author_id", as: "Autor" });
    Sector.hasMany(Publicacion, { foreignKey: "sector_id", as: "Publicaciones" });
    Publicacion.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });
    Publicacion.hasMany(ArchivoPublicacion, { foreignKey: "publicacion_id", as: "Archivo" });
    ArchivoPublicacion.belongsTo(Publicacion, { foreignKey: "publicacion_id", as: "Publicacion" });

    User.hasMany(Solicitud, { foreignKey: "user_id", as: "Solicitudes" });
    Solicitud.belongsTo(User, { foreignKey: "user_id", as: "Solicitante" });
    Servicio.hasMany(Solicitud, { foreignKey: "servicio_id", as: "Solicitudes" });
    Solicitud.belongsTo(Servicio, { foreignKey: "servicio_id", as: "Servicio" });
    Estado.hasMany(Solicitud, { foreignKey: "estado_id", as: "Solicitudes" });
    Solicitud.belongsTo(Estado, { foreignKey: "estado_id", as: "Estado" });
};

registerAssociations();

export {
    ArchivoPublicacion,
    Estado,
    Profile,
    Propuesta,
    Publicacion,
    Sector,
    Servicio,
    Solicitud,
    User,
};
