import { ArchivoPublicacion } from "./archivoPublicacion.model.js";
import { Estado } from "./estado.model.js";
import { InscripcionCapacitacion } from "./inscripcionCapacitacion.model.js";
import { Notificacion } from "./notificacion.model.js";
import { PreferenciaNotificacion } from "./preferenciaNotificacion.model.js";
import { Profile } from "./profile.model.js";
import { Propuesta } from "./propuesta.model.js";
import { Publicacion } from "./publicacion.model.js";
import { ResenaServicio } from "./resenaServicio.model.js";
import { Sector } from "./sector.model.js";
import { Servicio } from "./servicio.model.js";
import { Solicitud } from "./solicitud.model.js";
import { User } from "./user.model.js";

// Las asociaciones se registran una sola vez, en un unico lugar.
export const registerAssociations = (): void => {
    User.hasOne(Profile, { foreignKey: "user_id", as: "Profile" });
    Profile.belongsTo(User, { foreignKey: "user_id", as: "User" });

    User.hasMany(Servicio, { foreignKey: "proveedor_id", as: "ServiciosOfrecidos" });
    Servicio.belongsTo(User, { foreignKey: "proveedor_id", as: "Proveedor" });
    Sector.hasMany(Servicio, { foreignKey: "sector_id", as: "Servicios" });
    Servicio.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });

    Servicio.hasMany(ResenaServicio, {
        foreignKey: "servicio_id",
        as: "Resenas",
        onDelete: "CASCADE",
    });
    ResenaServicio.belongsTo(Servicio, { foreignKey: "servicio_id", as: "Servicio" });
    User.hasMany(ResenaServicio, {
        foreignKey: "user_id",
        as: "ResenasEmitidas",
        onDelete: "CASCADE",
    });
    ResenaServicio.belongsTo(User, { foreignKey: "user_id", as: "Autor" });

    User.hasMany(Propuesta, { foreignKey: "solicitante", as: "PropuestasSolicitadas" });
    Propuesta.belongsTo(User, { foreignKey: "solicitante", as: "Solicitante" });
    User.hasMany(Propuesta, { foreignKey: "cirRevisorId", as: "PropuestasRevisadas" });
    Propuesta.belongsTo(User, { foreignKey: "cirRevisorId", as: "Revisor" });
    Sector.hasMany(Propuesta, { foreignKey: "sector_id", as: "Propuestas" });
    Propuesta.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });
    Estado.hasMany(Propuesta, { foreignKey: "estado_id", as: "Propuestas" });
    Propuesta.belongsTo(Estado, { foreignKey: "estado_id", as: "Estado" });

    Servicio.hasOne(Propuesta, {
        foreignKey: "servicio_generado_id",
        as: "PropuestaVinculada",
        constraints: false,
    });
    Propuesta.belongsTo(Servicio, {
        foreignKey: "servicio_generado_id",
        as: "ServicioGenerado",
        constraints: false,
    });
    Servicio.belongsTo(Propuesta, {
        foreignKey: "propuesta_id",
        as: "PropuestaOrigen",
        constraints: false,
    });

    User.hasMany(Publicacion, { foreignKey: "author_id", as: "Publicaciones" });
    Publicacion.belongsTo(User, { foreignKey: "author_id", as: "Autor" });
    Sector.hasMany(Publicacion, { foreignKey: "sector_id", as: "Publicaciones" });
    Publicacion.belongsTo(Sector, { foreignKey: "sector_id", as: "Sector" });
    Publicacion.hasMany(ArchivoPublicacion, { foreignKey: "publicacion_id", as: "Archivo" });
    ArchivoPublicacion.belongsTo(Publicacion, { foreignKey: "publicacion_id", as: "Publicacion" });

    User.hasMany(Solicitud, { foreignKey: "user_id", as: "Solicitudes" });
    Solicitud.belongsTo(User, { foreignKey: "user_id", as: "Solicitante" });
    User.hasMany(Solicitud, {
        foreignKey: "cancelado_por_id",
        as: "SolicitudesCanceladas",
        onDelete: "SET NULL",
    });
    Solicitud.belongsTo(User, {
        foreignKey: "cancelado_por_id",
        as: "CanceladoPor",
        onDelete: "SET NULL",
    });
    Servicio.hasMany(Solicitud, { foreignKey: "servicio_id", as: "Solicitudes" });
    Solicitud.belongsTo(Servicio, { foreignKey: "servicio_id", as: "Servicio" });
    Estado.hasMany(Solicitud, { foreignKey: "estado_id", as: "Solicitudes" });
    Solicitud.belongsTo(Estado, { foreignKey: "estado_id", as: "Estado" });

    User.hasMany(InscripcionCapacitacion, {
        foreignKey: "user_id",
        as: "InscripcionesCapacitaciones",
        onDelete: "CASCADE",
    });
    InscripcionCapacitacion.belongsTo(User, {
        foreignKey: "user_id",
        as: "Participante",
    });
    Publicacion.hasMany(InscripcionCapacitacion, {
        foreignKey: "publicacion_id",
        as: "Inscripciones",
        onDelete: "CASCADE",
    });
    InscripcionCapacitacion.belongsTo(Publicacion, {
        foreignKey: "publicacion_id",
        as: "Publicacion",
    });

    User.hasMany(Notificacion, {
        foreignKey: "user_id",
        as: "Notificaciones",
        onDelete: "RESTRICT",
    });
    Notificacion.belongsTo(User, {
        foreignKey: "user_id",
        as: "Destinatario",
        onDelete: "RESTRICT",
    });

    User.hasOne(PreferenciaNotificacion, {
        foreignKey: "user_id",
        as: "PreferenciaNotificacion",
        onDelete: "RESTRICT",
    });
    PreferenciaNotificacion.belongsTo(User, {
        foreignKey: "user_id",
        as: "User",
        onDelete: "RESTRICT",
    });
};

registerAssociations();

export {
    ArchivoPublicacion,
    Estado,
    InscripcionCapacitacion,
    Notificacion,
    PreferenciaNotificacion,
    Profile,
    Propuesta,
    Publicacion,
    ResenaServicio,
    Sector,
    Servicio,
    Solicitud,
    User,
};
