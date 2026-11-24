import {
    forbiddenError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import {
    Notificacion,
    PreferenciaNotificacion,
    Profile,
    User,
} from "../models/index.js";
import type {
    ReferenciaNotificacion,
    TipoNotificacion,
} from "../models/notificacion.model.js";
import { DEFAULT_PREFERENCIAS_NOTIFICACION } from "../models/preferenciaNotificacion.model.js";
import { enqueueAndSendWhatsApp } from "../utils/whatsapp.provider.js";

export interface ActualizarPreferenciasInput {
    noticias_publicaciones?: boolean;
    cambios_propuestas?: boolean;
    nuevos_servicios?: boolean;
    actualizaciones_plataforma?: boolean;
    actividad_usuario?: boolean;
    canal_whatsapp?: boolean;
}

export interface CrearNotificacionParams {
    userId: number;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    enlace?: string | null;
    referencia_tipo?: ReferenciaNotificacion | string | null;
    referencia_id?: number | null;
}

const mapTipoToPreferenceField = (
    tipo: TipoNotificacion,
): keyof typeof DEFAULT_PREFERENCIAS_NOTIFICACION => {
    switch (tipo) {
        case "NUEVA_PUBLICACION":
            return "noticias_publicaciones";
        case "CAMBIO_ESTADO_PROPUESTA":
            return "cambios_propuestas";
        case "NUEVO_SERVICIO":
            return "nuevos_servicios";
        case "ACTUALIZACION_PLATAFORMA":
            return "actualizaciones_plataforma";
        case "ACTIVIDAD_USUARIO":
        default:
            return "actividad_usuario";
    }
};

export const obtenerPreferencias = async (userId: number) => {
    const [pref] = await PreferenciaNotificacion.findOrCreate({
        where: { user_id: userId },
        defaults: {
            user_id: userId,
            ...DEFAULT_PREFERENCIAS_NOTIFICACION,
        },
    });
    return pref;
};

export const actualizarPreferencias = async (
    userId: number,
    input: ActualizarPreferenciasInput,
) => {
    const pref = await obtenerPreferencias(userId);

    const updates: Partial<ActualizarPreferenciasInput> = {};
    if (typeof input.noticias_publicaciones === "boolean") {
        updates.noticias_publicaciones = input.noticias_publicaciones;
    }
    if (typeof input.cambios_propuestas === "boolean") {
        updates.cambios_propuestas = input.cambios_propuestas;
    }
    if (typeof input.nuevos_servicios === "boolean") {
        updates.nuevos_servicios = input.nuevos_servicios;
    }
    if (typeof input.actualizaciones_plataforma === "boolean") {
        updates.actualizaciones_plataforma = input.actualizaciones_plataforma;
    }
    if (typeof input.actividad_usuario === "boolean") {
        updates.actividad_usuario = input.actividad_usuario;
    }
    if (typeof input.canal_whatsapp === "boolean") {
        updates.canal_whatsapp = input.canal_whatsapp;
    }

    await pref.update(updates);
    return pref;
};

export const listarPorUsuario = async (
    userId: number,
    options: { soloNoLeidas?: boolean; limit?: number } = {},
) => {
    const where: Record<string, unknown> = { user_id: userId };
    if (options.soloNoLeidas) {
        where.leida = false;
    }

    const limit =
        options.limit && Number.isInteger(options.limit) && options.limit > 0
            ? Math.min(options.limit, 100)
            : 50;

    const [items, unreadCount] = await Promise.all([
        Notificacion.findAll({
            where,
            order: [["createdAt", "DESC"]],
            limit,
        }),
        Notificacion.count({
            where: { user_id: userId, leida: false },
        }),
    ]);

    return {
        unreadCount,
        total: items.length,
        data: items,
    };
};

export const marcarLeida = async (id: number, userId: number) => {
    if (!Number.isInteger(id) || id <= 0) {
        throw validationError("El identificador de la notificación no es válido.");
    }

    const notificacion = await Notificacion.findByPk(id);
    if (!notificacion) {
        throw notFoundError("Notificación no encontrada.");
    }

    if (notificacion.user_id !== userId) {
        throw forbiddenError(
            "No tienes permisos para modificar esta notificación.",
        );
    }

    if (!notificacion.leida) {
        notificacion.leida = true;
        notificacion.fecha_lectura = new Date();
        await notificacion.save();
    }

    return notificacion;
};

export const marcarTodasLeidas = async (userId: number) => {
    const [updatedCount] = await Notificacion.update(
        {
            leida: true,
            fecha_lectura: new Date(),
        },
        {
            where: {
                user_id: userId,
                leida: false,
            },
        },
    );

    return { updatedCount };
};

export const crearNotificacionParaUsuario = async (
    params: CrearNotificacionParams,
) => {
    const pref = await obtenerPreferencias(params.userId);
    const prefField = mapTipoToPreferenceField(params.tipo);

    if (pref[prefField] === false) {
        return null;
    }

    const creada = await Notificacion.create({
        user_id: params.userId,
        tipo: params.tipo,
        titulo: params.titulo.trim().slice(0, 200),
        mensaje: params.mensaje.trim(),
        enlace: params.enlace ?? null,
        referencia_tipo: params.referencia_tipo ?? null,
        referencia_id: params.referencia_id ?? null,
        leida: false,
    });

    // Despacho complementario vía WhatsApp si el usuario activó canal_whatsapp y tiene teléfono cargado
    if (pref.canal_whatsapp !== false) {
        try {
            const profile = await Profile.findOne({
                where: { user_id: params.userId },
            });
            if (profile?.telefono_whatsapp) {
                await enqueueAndSendWhatsApp({
                    phone: profile.telefono_whatsapp,
                    subject: params.titulo,
                    body: params.mensaje,
                });
            }
        } catch {
            // No bloquear la notificación interna si falla el envío externo
        }
    }

    return creada;
};

export const notificarATodosLosUsuarios = async (
    params: Omit<CrearNotificacionParams, "userId"> & {
        excludeUserId?: number;
    },
) => {
    const usuariosActivos = await User.findAll({
        where: { isActive: true },
        attributes: ["id"],
    });

    const resultados: Notificacion[] = [];
    for (const u of usuariosActivos) {
        if (params.excludeUserId && u.id === params.excludeUserId) {
            continue;
        }
        try {
            const notif = await crearNotificacionParaUsuario({
                userId: u.id,
                tipo: params.tipo,
                titulo: params.titulo,
                mensaje: params.mensaje,
                enlace: params.enlace,
                referencia_tipo: params.referencia_tipo,
                referencia_id: params.referencia_id,
            });
            if (notif) resultados.push(notif);
        } catch {
            // Continuar con el resto de los destinatarios
        }
    }

    return resultados;
};

export const emitirAnuncioPlataforma = async (input: {
    titulo?: string;
    mensaje?: string;
    enlace?: string | null;
}) => {
    const titulo = input.titulo?.trim() ?? "";
    const mensaje = input.mensaje?.trim() ?? "";
    if (!titulo || !mensaje) {
        throw validationError(
            "El título y el mensaje del anuncio institucional son obligatorios.",
        );
    }

    const creadas = await notificarATodosLosUsuarios({
        tipo: "ACTUALIZACION_PLATAFORMA",
        titulo,
        mensaje,
        enlace: input.enlace?.trim() || null,
        referencia_tipo: "sistema",
    });

    return {
        enviadas: creadas.length,
    };
};
