/**
 * Modelos de dominio: lo que consume la UI.
 *
 * Centraliza los tipos de sesión y reexporta los contratos modulares de
 * `catalogos`, `servicios`, `solicitudes`, `publicaciones`, `propuestas` y `perfil`.
 */

import type { Rol } from "./roles";

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */

export interface UsuarioAutenticado {
  id: number;
  username: string;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  msg: string;
  token: string;
}

export interface RegisterResponseDTO {
  msg: string;
  document_url: string | null;
}

/* ------------------------------------------------------------------ */
/* Reexportaciones por módulo                                          */
/* ------------------------------------------------------------------ */

export type {
  CatalogoListResponseDTO,
  Estado,
  EstadoDTO,
  Sector,
  SectorDTO,
} from "./catalogos";

export type {
  CrearResenaInput,
  CrearServicioInput,
  PerfilResumenDTO,
  ResenaItemResponseDTO,
  ResenaServicio,
  ResenaServicioDTO,
  Servicio,
  ServicioDTO,
  ServicioItemResponseDTO,
  ServiciosListResponseDTO,
  Usuario,
  UsuarioResumenDTO,
} from "./servicios";

export type {
  Solicitud,
  SolicitudDTO,
  SolicitudItemResponseDTO,
  SolicitudesListResponseDTO,
} from "./solicitudes";

export type {
  ArchivoItemResponseDTO,
  ArchivoPublicacion,
  ArchivoPublicacionDTO,
  ArchivosListResponseDTO,
  CrearArchivoInput,
  GuardarPublicacionInput,
  Publicacion,
  PublicacionDTO,
  PublicacionesListResponseDTO,
  PublicacionItemResponseDTO,
  TipoArchivo,
  TipoContenido,
} from "./publicaciones";

export type {
  CrearPropuestaInput,
  DecisionDictamen,
  Propuesta,
  PropuestaDTO,
  PropuestaMutationResponseDTO,
  PropuestasListResponseDTO,
} from "./propuestas";

export type {
  ActividadPerfil,
  ActividadPerfilDTO,
  ActividadPerfilResponseDTO,
  ActualizarPerfilInput,
  CambiarPasswordInput,
  EstadoInscripcionCapacitacion,
  InscripcionCapacitacion,
  InscripcionCapacitacionDTO,
  PerfilDTO,
  PerfilResponseDTO,
  UsuarioDTO,
} from "./perfil";
