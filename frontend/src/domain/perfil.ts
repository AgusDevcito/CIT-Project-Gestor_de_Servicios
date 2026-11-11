/**
 * Contratos de dominio y DTOs para el módulo de Mi Perfil, Seguridad de Cuenta
 * y Actividad Personal (Mis Propuestas, Mis Servicios y Mis Capacitaciones).
 */

import type { Propuesta, PropuestaDTO } from "./propuestas";
import type { Publicacion, PublicacionDTO } from "./publicaciones";
import type { Rol } from "./roles";
import type { Solicitud, SolicitudDTO } from "./solicitudes";

export type EstadoInscripcionCapacitacion = "INSCRIPTO" | "EN_CURSO" | "FINALIZADO";

export interface UsuarioDTO {
  id: number;
  username: string;
  email: string;
  role: Rol;
}

export interface PerfilDTO {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio?: string | null;
  User: UsuarioDTO;
}

export interface PerfilResponseDTO {
  msg?: string;
  data: PerfilDTO;
}

export interface ActualizarPerfilInput {
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio?: string;
}

export interface CambiarPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface InscripcionCapacitacionDTO {
  id: number;
  user_id: number;
  publicacion_id: number;
  estado: EstadoInscripcionCapacitacion;
  observaciones?: string | null;
  createdAt: string;
  Publicacion?: PublicacionDTO;
}

export interface InscripcionCapacitacion {
  id: number;
  user_id: number;
  publicacion_id: number;
  estado: EstadoInscripcionCapacitacion;
  observaciones: string | null;
  createdAt: string;
  Publicacion?: Publicacion;
}

export interface ActividadPerfilDTO {
  propuestas: PropuestaDTO[];
  servicios: SolicitudDTO[];
  capacitaciones: InscripcionCapacitacionDTO[];
}

export interface ActividadPerfilResponseDTO {
  data: ActividadPerfilDTO;
}

export interface ActividadPerfil {
  propuestas: Propuesta[];
  servicios: Solicitud[];
  capacitaciones: InscripcionCapacitacion[];
}
