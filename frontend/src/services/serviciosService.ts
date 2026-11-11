/**
 * Servicio de Servicios del CIT: casos de uso para catálogo, detalle, alta
 * y registro de calificaciones/reseñas.
 */

import * as serviciosRepository from "../repositories/servicios.repository";
import type {
  CrearResenaInput,
  CrearServicioInput,
  ResenaServicio,
  Servicio,
} from "../domain/servicios";

export const getServicios = async (): Promise<Servicio[]> =>
  serviciosRepository.listarServicios();

export const getServicioById = async (id: number): Promise<Servicio> =>
  serviciosRepository.obtenerServicioPorId(id);

/** Solo personal CIT y Admin. */
export const createServicio = async (
  payload: CrearServicioInput,
): Promise<Servicio> => serviciosRepository.crearServicio(payload);

/** Solo usuarios con solicitud previa del servicio. */
export const createResenaServicio = async (
  servicioId: number,
  payload: CrearResenaInput,
): Promise<{ msg: string; data: ResenaServicio }> =>
  serviciosRepository.crearResenaServicio(servicioId, payload);
