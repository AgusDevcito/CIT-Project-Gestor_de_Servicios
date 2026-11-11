/**
 * Servicio de Publicaciones y Archivos Adjuntos: casos de uso para lectura y ABM.
 */

import * as publicacionesRepository from "../repositories/publicaciones.repository";
import type {
  ArchivoPublicacion,
  CrearArchivoInput,
  GuardarPublicacionInput,
  Publicacion,
} from "../domain/publicaciones";

export const getPublicaciones = async (): Promise<Publicacion[]> =>
  publicacionesRepository.listarPublicaciones();

export const getPublicacionById = async (id: number): Promise<Publicacion> =>
  publicacionesRepository.obtenerPublicacionPorId(id);

/** Solo personal CIT y Admin. */
export const createPublicacion = async (
  payload: GuardarPublicacionInput,
): Promise<Publicacion> => publicacionesRepository.crearPublicacion(payload);

/** Solo personal CIT y Admin. */
export const updatePublicacion = async (
  id: number,
  payload: GuardarPublicacionInput,
): Promise<Publicacion> =>
  publicacionesRepository.actualizarPublicacion(id, payload);

/** Publicar o despublicar (solo personal CIT y Admin). */
export const toggleEstadoPublicacion = async (
  id: number,
  publicado?: boolean,
): Promise<Publicacion> =>
  publicacionesRepository.cambiarEstadoPublicacion(id, publicado);

/** Solo personal CIT y Admin. */
export const deletePublicacion = async (id: number): Promise<void> =>
  publicacionesRepository.eliminarPublicacion(id);

export const getArchivosByPublicacion = async (
  publicacionId: number,
): Promise<ArchivoPublicacion[]> =>
  publicacionesRepository.listarArchivosPorPublicacion(publicacionId);

/** Solo personal CIT y Admin. */
export const addArchivo = async (
  publicacionId: number,
  payload: CrearArchivoInput,
): Promise<ArchivoPublicacion> =>
  publicacionesRepository.agregarArchivo(publicacionId, payload);

/** Solo personal CIT y Admin. */
export const deleteArchivo = async (archivoId: number): Promise<void> =>
  publicacionesRepository.eliminarArchivo(archivoId);
