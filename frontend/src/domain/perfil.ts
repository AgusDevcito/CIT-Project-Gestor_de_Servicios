/**
 * Contratos de dominio y DTOs para el módulo de Mi Perfil, Seguridad de Cuenta,
 * Perfil de Entidad / Cooperativa (Nivel 4) y Actividad Personal.
 */

import type { Propuesta, PropuestaDTO } from "./propuestas";
import type { Publicacion, PublicacionDTO } from "./publicaciones";
import type { Rol } from "./roles";
import type { Usuario, UsuarioResumenDTO } from "./servicios";
import type { Solicitud, SolicitudDTO } from "./solicitudes";

export type EstadoInscripcionCapacitacion = "INSCRIPTO" | "EN_CURSO" | "FINALIZADO";
export type TipoPerfil = "PRODUCTOR" | "ENTIDAD_COOPERATIVA";

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
  tipo_perfil?: TipoPerfil;
  razon_social?: string | null;
  cuit?: string | null;
  localidad?: string | null;
  telefono_whatsapp?: string | null;
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
  tipo_perfil?: TipoPerfil;
  razon_social?: string | null;
  cuit?: string | null;
  localidad?: string | null;
  telefono_whatsapp?: string | null;
}

export interface CambiarPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface EliminarCuentaInput {
  password: string;
  confirmacion: string;
}

export interface InscripcionCapacitacionDTO {
  id: number;
  user_id: number;
  publicacion_id: number;
  estado: EstadoInscripcionCapacitacion;
  observaciones?: string | null;
  createdAt: string;
  Publicacion?: PublicacionDTO;
  Participante?: UsuarioResumenDTO;
}

export interface InscripcionCapacitacion {
  id: number;
  user_id: number;
  publicacion_id: number;
  estado: EstadoInscripcionCapacitacion;
  observaciones: string | null;
  createdAt: string;
  Publicacion?: Publicacion;
  Participante?: Usuario;
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
