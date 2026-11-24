import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import {
    AppError,
    ERROR_CODES,
    conflictError,
    forbiddenError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import { ESTADO } from "../constants/estados.js";
import type { Rol } from "../constants/roles.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as servicioRepository from "../repositories/servicio.repository.js";
import * as solicitudRepository from "../repositories/solicitud.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as mailService from "../utils/mail.js";
import * as notificacionService from "./notificacion.service.js";

const ESTADOS_SOLICITUD_ACTIVA: readonly string[] = [
    ESTADO.PENDIENTE,
    ESTADO.APROBADO,
    ESTADO.ACEPTADA,
];

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const ALLOWED_MIMES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const safeUnlink = async (filePath?: string): Promise<void> => {
    if (!filePath) return;
    try {
        await fsPromises.unlink(filePath);
    } catch {
        // Ignorar si ya fue eliminado
    }
};

const ensureEstado = async (codigo: string, nombreDefault: string) => {
    const existente = await catalogRepository.findEstado(codigo);
    if (existente) return existente;
    await catalogRepository.upsertEstado(codigo, nombreDefault);
    return catalogRepository.findEstado(codigo);
};

const validarArchivoResultado = async (
    file: Express.Multer.File,
): Promise<{ resultadoUrl: string; resultadoNombre: string }> => {
    const originalName = path.basename(file.originalname || "resultado.pdf");
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
        await safeUnlink(file.path);
        throw validationError(
            "Formato de archivo no permitido. Solo se aceptan informes en PDF, PNG o JPG.",
        );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        await safeUnlink(file.path);
        throw validationError(
            "El archivo de resultado no puede estar vacío ni superar los 5 MB.",
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
            "El contenido del archivo no corresponde a un informe PDF o imagen PNG/JPG válida.",
        );
    }

    const safeStoredFilename = path.basename(file.filename);
    return {
        resultadoUrl: `/api/uploads/${safeStoredFilename}`,
        resultadoNombre: originalName.slice(0, 255),
    };
};

export const list = (user: { id: number; role: Rol }) => {
    const where =
        user.role === "admin" || user.role === "cit" ? {} : { user_id: user.id };
    return solicitudRepository.findAll(where);
};

export const getById = async (id: number) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la solicitud no es válido.");
    }
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
        throw notFoundError("Solicitud no encontrada.");
    }
    return solicitud;
};

export interface BeneficiarioSolicitudInput {
    beneficiario_nombre?: string | null;
    beneficiario_dni_cuit?: string | null;
    beneficiario_localidad?: string | null;
}

export const create = async (
    servicioId: unknown,
    userId: number,
    beneficiario?: BeneficiarioSolicitudInput,
) => {
    const idNumerico = Number(servicioId);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw validationError("Debés indicar un servicio válido para solicitar.");
    }

    const servicio = await servicioRepository.findById(idNumerico);
    if (!servicio) {
        throw notFoundError("El servicio solicitado no existe.");
    }

    const estado = await ensureEstado(ESTADO.PENDIENTE, "Pendiente");
    if (!estado) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El catálogo de estados no está inicializado.",
            500,
        );
    }

    const existentes = await solicitudRepository.findAll({
        user_id: userId,
        servicio_id: idNumerico,
    });

    const nombreBeneficiarioLimpio =
        beneficiario?.beneficiario_nombre?.trim().slice(0, 150) || null;
    const dniBeneficiarioLimpio =
        beneficiario?.beneficiario_dni_cuit?.trim().slice(0, 40) || null;
    const localidadBeneficiarioLimpia =
        beneficiario?.beneficiario_localidad?.trim().slice(0, 120) || null;

    const tieneSolicitudActiva = existentes.some((sol) => {
        const activa = ESTADOS_SOLICITUD_ACTIVA.includes(sol.Estado?.codigo ?? "");
        if (!activa) return false;
        // Si es en representación de un productor específico, permitir múltiples solicitudes para distintos productores
        if (nombreBeneficiarioLimpio) {
            return (
                (sol.beneficiario_nombre ?? "").toLowerCase() ===
                nombreBeneficiarioLimpio.toLowerCase()
            );
        }
        return !sol.beneficiario_nombre;
    });

    if (tieneSolicitudActiva) {
        throw conflictError(
            "Ya tenés una solicitud en curso para este servicio.",
        );
    }

    const creada = await solicitudRepository.create({
        user_id: userId,
        servicio_id: idNumerico,
        estado_id: estado.id,
        beneficiario_nombre: nombreBeneficiarioLimpio,
        beneficiario_dni_cuit: dniBeneficiarioLimpio,
        beneficiario_localidad: localidadBeneficiarioLimpia,
    });

    return (await solicitudRepository.findById(creada.id)) ?? creada;
};

export const updateEstado = async (
    id: number,
    estadoValue: unknown,
    observacionesCit?: unknown,
) => {
    const estado = await catalogRepository.findEstado(estadoValue);
    if (!estado) throw validationError("El estado no es válido.");

    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) throw notFoundError("Solicitud no encontrada.");

    solicitud.estado_id = estado.id;
    if (typeof observacionesCit === "string") {
        solicitud.observaciones_cit = observacionesCit.trim() || null;
    }
    await solicitudRepository.save(solicitud);

    const user = await userRepository.findByPk(solicitud.user_id);
    if (user && user.email) {
        await mailService.sendSolicitudStatusEmail(user.email, id, estado.nombre);
    }

    void notificacionService
        .crearNotificacionParaUsuario({
            userId: solicitud.user_id,
            tipo: "ACTIVIDAD_USUARIO",
            titulo: `Solicitud #${id} actualizada a ${estado.nombre}`,
            mensaje:
                solicitud.observaciones_cit ||
                `El estado de tu solicitud de servicio cambió a ${estado.nombre}.`,
            enlace: "/mis-servicios",
            referencia_tipo: "solicitud",
            referencia_id: id,
        })
        .catch(() => {});

    return (await solicitudRepository.findById(id)) ?? solicitud;
};

export const adjuntarResultado = async (
    id: number,
    input: {
        observaciones?: string | null;
        resultado_url?: string | null;
        resultado_nombre?: string | null;
        finalizar?: boolean | string;
    },
    file?: Express.Multer.File | null,
) => {
    if (!Number.isFinite(id) || id <= 0) {
        if (file) await safeUnlink(file.path);
        throw validationError("El identificador de la solicitud no es válido.");
    }

    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
        if (file) await safeUnlink(file.path);
        throw notFoundError("Solicitud no encontrada.");
    }

    const codigoActual = (solicitud.Estado?.codigo ?? "").toUpperCase();
    if (codigoActual === ESTADO.CANCELADA || codigoActual === "CANCELADO") {
        if (file) await safeUnlink(file.path);
        throw conflictError(
            "No se puede adjuntar un resultado a una solicitud cancelada.",
        );
    }

    let resolvedUrl = input.resultado_url?.trim() || solicitud.resultado_archivo_url || null;
    let resolvedNombre =
        input.resultado_nombre?.trim() || solicitud.resultado_nombre || null;

    if (file) {
        const validado = await validarArchivoResultado(file);
        if (solicitud.resultado_archivo_url) {
            const uploadDir = path.resolve(process.cwd(), "uploads");
            const prevPath = path.join(
                uploadDir,
                path.basename(solicitud.resultado_archivo_url),
            );
            await safeUnlink(prevPath);
        }
        resolvedUrl = validado.resultadoUrl;
        resolvedNombre = validado.resultadoNombre;
    }

    if (!resolvedUrl) {
        throw validationError(
            "Debés adjuntar un archivo PDF o imagen con el informe de resultados.",
        );
    }

    const observacionesLimpias =
        typeof input.observaciones === "string" && input.observaciones.trim()
            ? input.observaciones.trim()
            : solicitud.resultado_observaciones ?? null;

    solicitud.resultado_archivo_url = resolvedUrl;
    solicitud.resultado_nombre = resolvedNombre || `Informe-Solicitud-${id}.pdf`;
    solicitud.resultado_observaciones = observacionesLimpias;
    if (observacionesLimpias) {
        solicitud.observaciones_cit = observacionesLimpias;
    }
    solicitud.fecha_entrega_resultado = new Date();

    const debeFinalizar =
        input.finalizar === undefined ||
        input.finalizar === true ||
        input.finalizar === "true";

    if (debeFinalizar) {
        const estadoFinalizada = await ensureEstado(
            ESTADO.FINALIZADA,
            "Finalizada",
        );
        if (estadoFinalizada) {
            solicitud.estado_id = estadoFinalizada.id;
        }
    }

    await solicitudRepository.save(solicitud);

    const user = await userRepository.findByPk(solicitud.user_id);
    if (user && user.email) {
        await mailService.sendSolicitudStatusEmail(
            user.email,
            id,
            "Finalizada — Informe disponible",
        );
    }

    void notificacionService
        .crearNotificacionParaUsuario({
            userId: solicitud.user_id,
            tipo: "ACTIVIDAD_USUARIO",
            titulo: `Resultado Oficial disponible — Solicitud #${id}`,
            mensaje:
                solicitud.resultado_observaciones ||
                `Ya podés descargar el informe técnico (${solicitud.resultado_nombre}) desde Mis Servicios.`,
            enlace: "/mis-servicios",
            referencia_tipo: "solicitud",
            referencia_id: id,
        })
        .catch(() => {});

    return (await solicitudRepository.findById(id)) ?? solicitud;
};

export const cancelar = async (id: number, user: { id: number; role: Rol }) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la solicitud no es válido.");
    }
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
        throw notFoundError("Solicitud no encontrada.");
    }

    if (
        user.role !== "cit" &&
        user.role !== "admin" &&
        solicitud.user_id !== user.id
    ) {
        throw forbiddenError("No tienes permisos para cancelar esta solicitud.");
    }

    const codigoActual = (solicitud.Estado?.codigo ?? "").toUpperCase();
    if (codigoActual !== ESTADO.PENDIENTE) {
        throw conflictError(
            "Solo se pueden cancelar solicitudes que se encuentren en estado Pendiente.",
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

    solicitud.estado_id = estadoCancelada.id;
    solicitud.fecha_cancelacion = new Date();
    solicitud.cancelado_por_id = user.id;
    await solicitudRepository.save(solicitud);
    return (await solicitudRepository.findById(id)) ?? solicitud;
};

export const remove = async (id: number, user: { id: number; role: Rol }) => {
    if (!Number.isFinite(id) || id <= 0) {
        throw validationError("El identificador de la solicitud no es válido.");
    }
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
        throw notFoundError("Solicitud no encontrada.");
    }

    if (
        user.role !== "cit" &&
        user.role !== "admin" &&
        solicitud.user_id !== user.id
    ) {
        throw forbiddenError("No tienes permisos para eliminar esta solicitud.");
    }

    if (solicitud.resultado_archivo_url) {
        const uploadDir = path.resolve(process.cwd(), "uploads");
        const filePath = path.join(
            uploadDir,
            path.basename(solicitud.resultado_archivo_url),
        );
        await safeUnlink(filePath);
    }

    await solicitudRepository.deleteById(id);
    return { id };
};
