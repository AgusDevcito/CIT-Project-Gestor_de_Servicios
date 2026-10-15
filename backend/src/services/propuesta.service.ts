import {
    AppError,
    ERROR_CODES,
    conflictError,
    notFoundError,
    validationError,
} from "../errors/AppError.js";
import { ESTADO } from "../constants/estados.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as propuestaRepository from "../repositories/propuesta.repository.js";

export interface CreatePropuestaInput {
    titulo?: string;
    sector_id?: number | string;
    sector?: string;
    problematica?: string;
}

export const create = async (input: CreatePropuestaInput, solicitanteId: number) => {
    const { titulo, sector_id: requestedSector, sector, problematica } = input;

    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);
    const pendingState = await catalogRepository.findEstado(ESTADO.PENDIENTE);

    if (!titulo || !sectorItem || !problematica || !pendingState) {
        throw validationError(
            "Los campos titulo, sector y problematica son obligatorios.",
        );
    }

    return propuestaRepository.create({
        titulo,
        sector_id: sectorItem.id,
        problematica,
        solicitante: solicitanteId,
        estado_id: pendingState.id,
    });
};

export const listPending = async () => {
    const pendingState = await catalogRepository.findEstado(ESTADO.PENDIENTE);
    if (!pendingState) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El catálogo de estados no está inicializado.",
            500,
        );
    }

    return propuestaRepository.findPending(pendingState.id);
};

export const dictate = async (
    id: number,
    decision: string | undefined,
    justificacion: string | undefined,
    revisorId: number,
) => {
    const estadoCodigo =
        decision === ESTADO.APROBADO ? ESTADO.APROBADO : ESTADO.RECHAZADO;
    const estadoDecision = await catalogRepository.findEstado(estadoCodigo);

    if (decision !== ESTADO.APROBADO && decision !== ESTADO.RECHAZADO) {
        throw validationError('La decisión debe ser "APROBADO" o "RECHAZADO".');
    }

    if (!estadoDecision) {
        throw new AppError(
            ERROR_CODES.CATALOG_NOT_SEEDED,
            "El estado solicitado no está configurado.",
            500,
        );
    }

    if (!justificacion || justificacion.trim().length < 15) {
        throw validationError(
            "Se requiere una justificación técnica de al menos 15 caracteres.",
        );
    }

    const propuesta = await propuestaRepository.findByIdWithIncludes(id);
    if (!propuesta) throw notFoundError("Propuesta no encontrada.");

    if (propuesta.Estado?.codigo !== ESTADO.PENDIENTE) {
        throw conflictError(
            `La propuesta ya fue dictaminada previamente con estado: ${propuesta.Estado?.nombre}.`,
        );
    }

    propuesta.estado_id = estadoDecision.id;
    propuesta.citJustificacion = justificacion.trim();
    propuesta.cirRevisorId = revisorId;
    propuesta.citFechaRevision = new Date();

    await propuestaRepository.save(propuesta);

    return propuesta;
};
