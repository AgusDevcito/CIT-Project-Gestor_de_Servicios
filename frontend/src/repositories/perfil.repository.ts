/**
 * Repositorio de Perfil: acceso a datos HTTP para lectura/actualización de perfil,
 * cambio de contraseña y actividad privada del usuario autenticado.
 */

import { http } from "../lib/http";
import type {
  ActividadPerfil,
  ActividadPerfilResponseDTO,
  ActualizarPerfilInput,
  CambiarPasswordInput,
  InscripcionCapacitacion,
  InscripcionCapacitacionDTO,
  PerfilDTO,
  PerfilResponseDTO,
} from "../domain/perfil";
import { mapearPropuesta } from "./propuestas.repository";
import { mapearPublicacion } from "./publicaciones.repository";
import { mapearSolicitud } from "./solicitudes.repository";

export const mapearInscripcionCapacitacion = (
  dto: InscripcionCapacitacionDTO,
): InscripcionCapacitacion => ({
  id: dto.id,
  user_id: dto.user_id,
  publicacion_id: dto.publicacion_id,
  estado: dto.estado,
  observaciones: dto.observaciones ?? null,
  createdAt: dto.createdAt,
  Publicacion: dto.Publicacion ? mapearPublicacion(dto.Publicacion) : undefined,
});

export const obtenerPerfilPorUsuarioId = async (
  userId: number,
): Promise<PerfilDTO> => {
  const { data } = await http.get<PerfilResponseDTO>(`/profile/${userId}`);
  return data.data;
};

export const actualizarPerfil = async (
  userId: number,
  input: ActualizarPerfilInput,
): Promise<PerfilDTO> => {
  // Aseguramos que jamás se envíen atributos administrativos (rol, email, permisos)
  const payloadSeguro: ActualizarPerfilInput = {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    avatar_url: input.avatar_url.trim(),
    bio: input.bio?.trim() ?? "",
  };
  const { data } = await http.put<PerfilResponseDTO>(
    `/profile/${userId}`,
    payloadSeguro,
  );
  return data.data;
};

export const cambiarPassword = async (
  input: CambiarPasswordInput,
): Promise<{ msg: string }> => {
  const { data } = await http.put<{ msg: string }>("/change-password", input);
  return data;
};

export const obtenerActividadPorUsuarioId = async (
  userId: number,
): Promise<ActividadPerfil> => {
  const { data } = await http.get<ActividadPerfilResponseDTO>(
    `/profile/${userId}/actividad`,
  );
  return {
    propuestas: (data.data?.propuestas ?? []).map(mapearPropuesta),
    servicios: (data.data?.servicios ?? []).map(mapearSolicitud),
    capacitaciones: (data.data?.capacitaciones ?? []).map(
      mapearInscripcionCapacitacion,
    ),
  };
};

export const listarMisCapacitaciones = async (): Promise<
  InscripcionCapacitacion[]
> => {
  const { data } = await http.get<{
    count?: number;
    data: InscripcionCapacitacionDTO[];
  }>("/mis-capacitaciones");
  return (data.data ?? []).map(mapearInscripcionCapacitacion);
};

export const inscribirEnCapacitacion = async (
  publicacionId: number,
): Promise<{ msg: string; data: InscripcionCapacitacion }> => {
  const { data } = await http.post<{
    msg: string;
    data: InscripcionCapacitacionDTO;
  }>(`/capacitaciones/${publicacionId}/inscribirse`);
  return {
    msg: data.msg,
    data: mapearInscripcionCapacitacion(data.data),
  };
};
