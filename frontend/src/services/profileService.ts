/**
 * Servicio de Perfil: casos de uso para consultar/actualizar datos personales,
 * cambiar la contraseña y obtener la actividad privada del usuario autenticado.
 */

import * as perfilRepository from "../repositories/perfil.repository";
import type {
  ActividadPerfil,
  ActualizarPerfilInput,
  CambiarPasswordInput,
  InscripcionCapacitacion,
  PerfilDTO,
} from "../domain/perfil";

export const getProfileByUserId = async (userId: number): Promise<PerfilDTO> =>
  perfilRepository.obtenerPerfilPorUsuarioId(userId);

export const updateProfile = async (
  userId: number,
  payload: ActualizarPerfilInput,
): Promise<PerfilDTO> => perfilRepository.actualizarPerfil(userId, payload);

export const changePassword = async (
  payload: CambiarPasswordInput,
): Promise<{ msg: string }> => perfilRepository.cambiarPassword(payload);

export const getActividadPerfil = async (
  userId: number,
): Promise<ActividadPerfil> =>
  perfilRepository.obtenerActividadPorUsuarioId(userId);

export const getMisCapacitaciones = async (): Promise<
  InscripcionCapacitacion[]
> => perfilRepository.listarMisCapacitaciones();

export const enrollInCapacitacion = async (
  publicacionId: number,
): Promise<{ msg: string; data: InscripcionCapacitacion }> =>
  perfilRepository.inscribirEnCapacitacion(publicacionId);
