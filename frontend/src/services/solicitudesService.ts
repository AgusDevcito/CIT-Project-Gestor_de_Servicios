/**
 * Servicio de Solicitudes: casos de uso para solicitar servicios, gestionar su estado
 * y entregar resultados digitales (Nivel 2).
 */

import * as solicitudesRepository from "../repositories/solicitudes.repository";
import type {
  Solicitud,
  SubirResultadoSolicitudInput,
} from "../domain/solicitudes";

/** Un usuario normal ve solo las suyas; CIT/admin ven todas con el Solicitante incluido. */
export const getSolicitudes = async (): Promise<Solicitud[]> =>
  solicitudesRepository.listarSolicitudes();

export const createSolicitud = async (
  servicioId: number,
  beneficiario?: {
    beneficiario_nombre?: string;
    beneficiario_dni_cuit?: string;
    beneficiario_localidad?: string;
  },
): Promise<Solicitud> =>
  solicitudesRepository.crearSolicitud(servicioId, beneficiario);

/** Solo admin/CIT: recibe el código del estado (ej. "PENDIENTE", "APROBADO", "RECHAZADO") y observaciones opcionales. */
export const updateSolicitudEstado = async (
  id: number,
  estadoCodigo: string,
  observacionesCit?: string,
): Promise<Solicitud> =>
  solicitudesRepository.actualizarEstadoSolicitud(
    id,
    estadoCodigo,
    observacionesCit,
  );

/** Solo admin/CIT: adjunta el informe o certificado de resultado (PDF/PNG/JPG) a una solicitud. */
export const subirResultadoSolicitud = async (
  id: number,
  payload: SubirResultadoSolicitudInput,
): Promise<{ msg: string; data: Solicitud }> =>
  solicitudesRepository.subirResultadoSolicitud(id, payload);

/** Permite al solicitante titular cancelar una solicitud en estado PENDIENTE. */
export const cancelarSolicitud = async (
  id: number,
): Promise<{ msg: string; data: Solicitud }> =>
  solicitudesRepository.cancelarSolicitud(id);

/** Permite a personal CIT o al solicitante titular eliminar una solicitud. */
export const deleteSolicitud = async (id: number): Promise<void> => {
  await solicitudesRepository.eliminarSolicitud(id);
};
