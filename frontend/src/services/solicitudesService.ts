/**
 * Servicio de Solicitudes: casos de uso para solicitar servicios y gestionar su estado.
 */

import * as solicitudesRepository from "../repositories/solicitudes.repository";
import type { Solicitud } from "../domain/solicitudes";

/** Un usuario normal ve solo las suyas; CIT/admin ven todas con el Solicitante incluido. */
export const getSolicitudes = async (): Promise<Solicitud[]> =>
  solicitudesRepository.listarSolicitudes();

export const createSolicitud = async (servicioId: number): Promise<Solicitud> =>
  solicitudesRepository.crearSolicitud(servicioId);

/** Solo admin/CIT: recibe el código del estado (ej. "PENDIENTE", "APROBADO", "RECHAZADO"). */
export const updateSolicitudEstado = async (
  id: number,
  estadoCodigo: string,
): Promise<Solicitud> =>
  solicitudesRepository.actualizarEstadoSolicitud(id, estadoCodigo);

/** Permite a personal CIT o al solicitante titular eliminar una solicitud. */
export const deleteSolicitud = async (id: number): Promise<void> => {
  await solicitudesRepository.eliminarSolicitud(id);
};
