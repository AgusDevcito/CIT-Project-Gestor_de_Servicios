/**
 * Servicio de Propuestas: casos de uso para envío, seguimiento, toma en revisión
 * y dictamen técnico con generación de servicio en catálogo.
 */

import * as propuestasRepository from "../repositories/propuestas.repository";
import type {
  CrearPropuestaInput,
  DecisionDictamen,
  OpcionesServicioPropuestaInput,
  Propuesta,
} from "../domain/propuestas";

/**
 * Devuelve las propuestas visibles según el rol autenticado:
 * - Rol `user`: todas sus propias propuestas enviadas.
 * - Rol `cit` / `admin`: todas las propuestas del sistema (o filtradas por `estado`).
 */
export const getPropuestas = async (estado?: string): Promise<Propuesta[]> =>
  propuestasRepository.listarPropuestas(estado);

/** Devuelve las propuestas con estado PENDIENTE. */
export const getPropuestasPendientes = async (): Promise<Propuesta[]> =>
  propuestasRepository.listarPropuestas("PENDIENTE");

/** Solo CIT/Admin: obtiene el detalle completo de una propuesta por ID. */
export const getPropuestaById = async (id: number): Promise<Propuesta> =>
  propuestasRepository.obtenerPropuestaPorId(id);

/** Solo usuario normal: crea una nueva problemática / propuesta. */
export const crearPropuesta = async (
  payload: CrearPropuestaInput,
): Promise<{ msg: string; data?: Propuesta }> =>
  propuestasRepository.crearPropuesta(payload);

/** Solo CIT/Admin: toma una propuesta pendiente pasándola al estado EN_REVISION. */
export const tomarPropuestaEnRevision = async (
  id: number,
): Promise<{ msg: string; data?: Propuesta }> =>
  propuestasRepository.tomarEnRevision(id);

/**
 * Solo CIT/Admin: decisión "ACEPTADA" | "APROBADO" | "RECHAZADO" con justificación
 * (mín. 15 caracteres). Si se acepta, genera el servicio en el catálogo.
 */
export const dictaminarPropuesta = async (
  id: number,
  decision: DecisionDictamen,
  justificacion: string,
  opcionesServicio?: OpcionesServicioPropuestaInput,
): Promise<{ msg: string; data?: Propuesta }> =>
  propuestasRepository.dictaminarPropuesta(
    id,
    decision,
    justificacion,
    opcionesServicio,
  );

/** Permite a personal CIT o al autor eliminar una propuesta. */
export const deletePropuesta = async (id: number): Promise<void> => {
  await propuestasRepository.eliminarPropuesta(id);
};
