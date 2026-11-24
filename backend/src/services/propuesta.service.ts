import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { sequelize } from "../config/db.js";
import { ESTADO } from "../constants/estados.js";
import type { Rol } from "../constants/roles.js";
import {
    AppError,
    ERROR_CODES,
    conflictError,
    forbiddenError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import { Servicio } from "../models/index.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as propuestaRepository from "../repositories/propuesta.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";
import * as notificacionService from "./notificacion.service.js";

export interface CreatePropuestaInput {
    titulo?: string;
    sector_id?: number | string;
    sector?: string;
    problematica?: string;
    nombre_organismo?: string | null;
    email_contacto?: string | null;
    telefono_contacto?: string | null;
    bienes_recursos?: string | null;
    documento_url?: string | null;
    documento_nombre?: string | null;
    beneficiario_nombre?: string | null;
    beneficiario_dni_cuit?: string | null;
    beneficiario_localidad?: string | null;
}

export interface OpcionesServicioGenerado {
    servicio_nombre?: string;
    servicio_description?: string;
    servicio_precio?: number | string;
    servicio_img?: string | null;
}

const ESTADOS_REVISABLES: readonly string[] = [
    ESTADO.PENDIENTE,
    ESTADO.EN_REVISION,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{6,30}$/;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const ALLOWED_MIMES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ensureEstado = async (codigo: string, nombreDefault: string) => {
    const existente = await catalogRepository.findEstado(codigo);
    if (existente) return existente;
    await catalogRepository.upsertEstado(codigo, nombreDefault);
    return catalogRepository.findEstado(codigo);
};

const safeUnlink = async (filePath?: string): Promise<void> => {
    if (!filePath) return;
    try {
        await fsPromises.unlink(filePath);
    } catch {
        // Ignorar si ya fue eliminado
    }
};

const validarArchivoPropuesta = async (
    file: Express.Multer.File,
): Promise<{ documentoUrl: string; documentoNombre: string }> => {
    const originalName = path.basename(file.originalname || "documento");
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        await safeUnlink(file.path);
        throw validationError(
            "Formato de archivo no permitido. Solo se aceptan documentos PDF, PNG o JPG.",
        );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        await safeUnlink(file.path);
        throw validationError(
            "El archivo adjunto no puede estar vacío ni superar los 5 MB.",
        );
    }

    const buffer = await fsPromises.readFile(file.path);
    const detected = await fileTypeFromBuffer(buffer);
    const esPdfPorCabecera =
        buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";

    const mimeValido =
        (detected && ALLOWED_MIMES.has(detected.mime)) ||
        (ext === ".pdf" && esPdfPorCabecera);

    if (!mimeValido) {
        await safeUnlink(file.path);
        throw validationError(
            "El contenido del archivo no corresponde a un documento PDF o imagen PNG/JPG válida.",
        );
    }

    const safeStoredFilename = path.basename(file.filename);
    return {
        documentoUrl: `/api/uploads/${safeStoredFilename}`,
        documentoNombre: originalName.slice(0, 255),
    };
};

export const create = async (
    input: CreatePropuestaInput,
    solicitanteId: number,
    file?: Express.Multer.File | null,
) => {
    const {
        titulo,
        sector_id: requestedSector,
        sector,
        problematica,
        nombre_organismo,
        email_contacto,
        telefono_contacto,
        bienes_recursos,
        documento_url,
        documento_nombre,
        beneficiario_nombre,
        beneficiario_dni_cuit,
        beneficiario_localidad,
    } = input;

    const tituloLimpio = titulo?.trim() ?? "";
    const problematicaLimpia = problematica?.trim() ?? "";
    const organismoLimpio = nombre_organismo?.trim() || null;
    const emailLimpio = email_contacto?.trim() || null;
    const telefonoLimpio = telefono_contacto?.trim() || null;
    const bienesLimpios = bienes_recursos?.trim() || null;
    const beneficiarioNombreLimpio = beneficiario_nombre?.trim().slice(0, 150) || null;
    const beneficiarioDniLimpio = beneficiario_dni_cuit?.trim().slice(0, 40) || null;
    const beneficiarioLocalidadLimpia =
        beneficiario_localidad?.trim().slice(0, 120) || null;

    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);
    const pendingState = await ensureEstado(ESTADO.PENDIENTE, "Pendiente");

    if (
        !organismoLimpio ||
        !emailLimpio ||
        !telefonoLimpio ||
        !tituloLimpio ||
        !sectorItem ||
        !problematicaLimpia ||
        !bienesLimpios ||
        !pendingState
    ) {
        if (file) await safeUnlink(file.path);
        throw validationError(
            "Todos los datos del organismo, de la propuesta y de los bienes o recursos son obligatorios.",
        );
    }

    if (problematicaLimpia.length < 20) {
        if (file) await safeUnlink(file.path);
        throw validationError(
            "La descripción de utilidad y funciones debe tener al menos 20 caracteres.",
        );
    }

    if (emailLimpio && !EMAIL_REGEX.test(emailLimpio)) {
        if (file) await safeUnlink(file.path);
        throw validationError("El correo electrónico de contacto no tiene un formato válido.");
    }

    if (telefonoLimpio && !TELEFONO_REGEX.test(telefonoLimpio)) {
        if (file) await safeUnlink(file.path);
        throw validationError(
            "El número de teléfono debe contener entre 6 y 30 caracteres válidos.",
        );
    }

    // Prevención de envíos duplicados accidentales del mismo usuario
    const propuestasPrevias = await propuestaRepository.findBySolicitante(solicitanteId);
    const duplicadaActiva = propuestasPrevias.find((item) => {
        const mismoTitulo =
            item.titulo.trim().toLowerCase() === tituloLimpio.toLowerCase();
        const codigoEstado = item.Estado?.codigo ?? ESTADO.PENDIENTE;
        const sigueEnEvaluacion = ESTADOS_REVISABLES.includes(codigoEstado);
        return mismoTitulo && sigueEnEvaluacion;
    });

    if (duplicadaActiva) {
        if (file) await safeUnlink(file.path);
        throw conflictError(
            "Ya tenés una propuesta en evaluación con este mismo nombre. Podés consultar su avance en el listado inferior.",
        );
    }

    let resolvedDocUrl = documento_url?.trim() || null;
    let resolvedDocNombre = documento_nombre?.trim() || null;

    if (file) {
        const validado = await validarArchivoPropuesta(file);
        resolvedDocUrl = validado.documentoUrl;
        resolvedDocNombre = validado.documentoNombre;
    }

    const creada = await propuestaRepository.create({
        titulo: tituloLimpio,
        sector_id: sectorItem.id,
        problematica: problematicaLimpia,
        solicitante: solicitanteId,
        estado_id: pendingState.id,
        nombre_organismo: organismoLimpio,
        email_contacto: emailLimpio,
        telefono_contacto: telefonoLimpio,
        bienes_recursos: bienesLimpios,
        documento_url: resolvedDocUrl,
        documento_nombre: resolvedDocNombre,
        beneficiario_nombre: beneficiarioNombreLimpio,
        beneficiario_dni_cuit: beneficiarioDniLimpio,
        beneficiario_localidad: beneficiarioLocalidadLimpia,
    });

    return (await propuestaRepository.findByIdWithIncludes(creada.id)) ?? creada;
};

export const list = async (
    user: { id: number; role: Rol },
    estadoFilter?: string,
) => {
    const where: Record<string, number> =
        user.role === "admin" || user.role === "cit"
            ? {}
            : { solicitante: user.id };

    if (estadoFilter) {
        const estadoItem = await catalogRepository.findEstado(estadoFilter);
        if (estadoItem) {
            where.estado_id = estadoItem.id;
        }
    }

    return propuestaRepository.findAll(where);
};

export const listPending = async () => {
    const pendingState = await ensureEstado(ESTADO.PENDIENTE, "Pendiente");
    if (!pendingState) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El catálogo de estados no está inicializado.",
            500,
        );
    }

    return propuestaRepository.findPending(pendingState.id);
};

export const getById = async (id: number) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la propuesta no es válido.");
    }
    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) {
        throw notFoundError("Propuesta no encontrada.");
    }
    return propuesta;
};

export const canAccessDocumento = async (
    safeFilename: string,
    user: { id: number; role: Rol },
): Promise<boolean> => {
    if (user.role === "admin" || user.role === "cit") {
        return true;
    }
    const urlPath = `/api/uploads/${safeFilename}`;
    const propuesta = await propuestaRepository.findByDocumentoUrl(urlPath);
    if (propuesta && propuesta.solicitante === user.id) {
        return true;
    }
    const solicitud = await solicitudRepository.findByResultadoUrl(urlPath);
    return Boolean(solicitud && solicitud.user_id === user.id);
};

export const tomarEnRevision = async (id: number, revisorId: number) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la propuesta no es válido.");
    }

    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) {
        throw notFoundError("Propuesta no encontrada.");
    }

    const codigoActual = propuesta.Estado?.codigo ?? "";
    if (codigoActual !== ESTADO.PENDIENTE) {
        throw conflictError(
            `Solo se pueden tomar para revisión propuestas en estado Pendiente (estado actual: ${
                propuesta.Estado?.nombre ?? codigoActual
            }).`,
        );
    }

    const estadoEnRevision = await ensureEstado(ESTADO.EN_REVISION, "En revisión");
    if (!estadoEnRevision) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El estado En revisión no está configurado.",
            500,
        );
    }

    propuesta.estado_id = estadoEnRevision.id;
    propuesta.cirRevisorId = revisorId;
    propuesta.citFechaRevision = new Date();

    await propuestaRepository.save(propuesta);
    void notificacionService
        .crearNotificacionParaUsuario({
            userId: propuesta.solicitante,
            tipo: "CAMBIO_ESTADO_PROPUESTA",
            titulo: `Tu propuesta "${propuesta.titulo}" está en revisión`,
            mensaje:
                "El equipo técnico del CIT Formosa tomó tu propuesta para evaluación.",
            enlace: "/ajustes/propuestas",
            referencia_tipo: "propuesta",
            referencia_id: propuesta.id,
        })
        .catch(() => {});

    return propuestaRepository.findByIdWithIncludes(id);
};

export const dictate = async (
    id: number,
    decision: string | undefined,
    justificacion: string | undefined,
    revisorId: number,
    opcionesServicio?: OpcionesServicioGenerado,
) => {
    const esAceptacion =
        decision === ESTADO.APROBADO || decision === ESTADO.ACEPTADA;
    const esRechazo = decision === ESTADO.RECHAZADO;

    if (!esAceptacion && !esRechazo) {
        throw validationError(
            'La decisión debe ser "ACEPTADA", "APROBADO" o "RECHAZADO".',
        );
    }

    if (!justificacion || justificacion.trim().length < 15) {
        throw validationError(
            "Se requiere una justificación técnica de al menos 15 caracteres.",
        );
    }

    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) throw notFoundError("Propuesta no encontrada.");

    const codigoActual = propuesta.Estado?.codigo ?? "";
    if (!ESTADOS_REVISABLES.includes(codigoActual)) {
        throw conflictError(
            `La propuesta ya fue dictaminada previamente con estado: ${propuesta.Estado?.nombre}.`,
        );
    }

    if (esRechazo) {
        const estadoRechazado = await ensureEstado(ESTADO.RECHAZADO, "Rechazado");
        if (!estadoRechazado) {
            throw new AppError(
                ERROR_CODES.CATALOG_NOT_SEEDED,
                "El estado Rechazado no está configurado.",
                500,
            );
        }

        propuesta.estado_id = estadoRechazado.id;
        propuesta.citJustificacion = justificacion.trim();
        propuesta.cirRevisorId = revisorId;
        propuesta.citFechaRevision = new Date();

        await propuestaRepository.save(propuesta);
        void notificacionService
            .crearNotificacionParaUsuario({
                userId: propuesta.solicitante,
                tipo: "CAMBIO_ESTADO_PROPUESTA",
                titulo: `Dictamen sobre propuesta "${propuesta.titulo}"`,
                mensaje: `Tu propuesta fue rechazada. Motivo técnico: ${propuesta.citJustificacion}`,
                enlace: "/ajustes/propuestas",
                referencia_tipo: "propuesta",
                referencia_id: propuesta.id,
            })
            .catch(() => {});
        return propuestaRepository.findByIdWithIncludes(id);
    }

    // Caso Aceptación: Validar datos del servicio y ejecutar en transacción atómica
    const codigoEstadoDestino =
        decision === ESTADO.ACEPTADA ? ESTADO.ACEPTADA : ESTADO.APROBADO;
    const nombreEstadoDestino =
        decision === ESTADO.ACEPTADA ? "Aceptada" : "Aprobado";

    const estadoDecision = await ensureEstado(
        codigoEstadoDestino,
        nombreEstadoDestino,
    );
    if (!estadoDecision) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El estado solicitado no está configurado.",
            500,
        );
    }

    const nombreServicio = (
        opcionesServicio?.servicio_nombre ?? propuesta.titulo
    )
        .trim()
        .slice(0, 120);
    const descripcionServicio = (
        opcionesServicio?.servicio_description ?? propuesta.problematica
    )
        .trim()
        .slice(0, 350);
    const precioServicio =
        opcionesServicio?.servicio_precio !== undefined
            ? Number(opcionesServicio.servicio_precio)
            : 0;

    if (!nombreServicio || !descripcionServicio || !propuesta.sector_id) {
        throw validationError(
            "La propuesta no cuenta con los datos requeridos (nombre, descripción y área) para convertirse en un servicio.",
        );
    }

    if (!Number.isFinite(precioServicio) || precioServicio < 0) {
        throw validationError("El arancel del servicio debe ser un monto válido.");
    }

    // Evitar creación duplicada de servicios para la misma propuesta
    if (propuesta.servicio_generado_id) {
        throw conflictError(
            `Esta propuesta ya generó previamente el servicio #${propuesta.servicio_generado_id}.`,
        );
    }

    await sequelize.transaction(async (transaction) => {
        const servicioExistente =
            await propuestaRepository.findServicioByPropuestaId(
                propuesta.id,
                transaction,
            );
        if (servicioExistente) {
            throw conflictError(
                `Esta propuesta ya fue incorporada al catálogo como el servicio "${servicioExistente.servicio_nombre}".`,
            );
        }

        const nuevoServicio = await Servicio.create(
            {
                servicio_nombre: nombreServicio,
                servicio_description: descripcionServicio,
                servicio_img: opcionesServicio?.servicio_img?.trim() || null,
                sector_id: propuesta.sector_id,
                servicio_precio: precioServicio,
                proveedor_id: revisorId,
                propuesta_id: propuesta.id,
            },
            { transaction },
        );

        propuesta.estado_id = estadoDecision.id;
        propuesta.citJustificacion = justificacion.trim();
        propuesta.cirRevisorId = revisorId;
        propuesta.citFechaRevision = new Date();
        propuesta.servicio_generado_id = nuevoServicio.id;

        await propuestaRepository.save(propuesta, transaction);
    });

    void notificacionService
        .crearNotificacionParaUsuario({
            userId: propuesta.solicitante,
            tipo: "CAMBIO_ESTADO_PROPUESTA",
            titulo: `¡Tu propuesta "${propuesta.titulo}" fue aprobada!`,
            mensaje: `Dictamen CIT: ${justificacion.trim()}. Ya fue incorporada al catálogo oficial de Servicios.`,
            enlace: "/ajustes/propuestas",
            referencia_tipo: "propuesta",
            referencia_id: propuesta.id,
        })
        .catch(() => {});

    if (propuesta.servicio_generado_id) {
        void notificacionService
            .notificarATodosLosUsuarios({
                tipo: "NUEVO_SERVICIO",
                titulo: `Nuevo servicio en catálogo: ${nombreServicio}`,
                mensaje: descripcionServicio,
                enlace: `/servicios/${propuesta.servicio_generado_id}`,
                referencia_tipo: "servicio",
                referencia_id: propuesta.servicio_generado_id,
            })
            .catch(() => {});
    }

    return propuestaRepository.findByIdWithIncludes(id);
};

export const cancelar = async (id: number, user: { id: number; role: Rol }) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la propuesta no es válido.");
    }
    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) {
        throw notFoundError("Propuesta no encontrada.");
    }

    if (
        user.role !== "cit" &&
        user.role !== "admin" &&
        propuesta.solicitante !== user.id
    ) {
        throw forbiddenError("No tienes permisos para cancelar esta propuesta.");
    }

    const codigoActual = (propuesta.Estado?.codigo ?? "").toUpperCase();
    if (!ESTADOS_REVISABLES.includes(codigoActual)) {
        throw conflictError(
            `Solo se pueden cancelar propuestas que aún estén pendientes o en revisión (estado actual: ${
                propuesta.Estado?.nombre ?? codigoActual
            }).`,
        );
    }

    const estadoCancelada = await ensureEstado(ESTADO.CANCELADA, "Cancelada");
    if (!estadoCancelada) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El estado Cancelada no está configurado.",
            500,
        );
    }

    propuesta.estado_id = estadoCancelada.id;
    await propuestaRepository.save(propuesta);
    return propuestaRepository.findByIdWithIncludes(id);
};

export const remove = async (id: number, user: { id: number; role: Rol }) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la propuesta no es válido.");
    }
    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) {
        throw notFoundError("Propuesta no encontrada.");
    }

    if (
        user.role !== "cit" &&
        user.role !== "admin" &&
        propuesta.solicitante !== user.id
    ) {
        throw forbiddenError("No tienes permisos para eliminar esta propuesta.");
    }

    if (propuesta.documento_url) {
        const uploadDir = path.resolve(process.cwd(), "uploads");
        const filePath = path.join(uploadDir, path.basename(propuesta.documento_url));
        await safeUnlink(filePath);
    }

    await propuestaRepository.deleteById(id);
    return { id, titulo: propuesta.titulo };
};
