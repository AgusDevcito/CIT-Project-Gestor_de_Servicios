/**
 * Modelos de dominio: lo que consume la UI.
 *
 * Deliberadamente NO reproducen la forma de los modelos de Sequelize que devuelve
 * el backend (alias `User`, `Sector`, `Proveedor`...). Esos alias son un detalle de
 * la capa de persistencia y quedan aislados en `repositories/`, de modo que un
 * cambio en el backend se traduzca en un solo archivo.
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

/* ------------------------------------------------------------------ */
/* DTOs: la forma exacta que devuelve el backend                       */
/* ------------------------------------------------------------------ */

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
  User: UsuarioDTO;
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
/* Entidades de negocio                                                */
/* ------------------------------------------------------------------ */

export interface Sector {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Estado {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  role: Rol;
}

export interface Servicio {
  id: number;
  servicio_nombre: string;
  servicio_description: string;
  servicio_img: string | null;
  sector_id: number;
  servicio_precio: number;
  proveedor_id: number;
  createdAt: string;
  Proveedor?: Usuario;
  Sector?: Sector;
}

export interface Solicitud {
  id: number;
  user_id: number;
  servicio_id: number;
  estado_id: number;
  fecha_solicitud: string | null;
  createdAt: string;
  Servicio?: Servicio;
  Estado?: Estado;
}

export type TipoContenido = "patologia" | "enfermedad" | "parasito" | "plaga" | "otro";
export type TipoArchivo = "imagen" | "video";

export interface ArchivoPublicacion {
  id: number;
  tipo: TipoArchivo;
  archivo_url: string;
  archivo_nombre: string | null;
  orden: number | null;
  publicacion_id: number;
}

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector_id: number;
  author_id: number | null;
  createdAt: string;
  Autor?: Usuario;
  Sector?: Sector;
  Archivo?: ArchivoPublicacion[];
}

export interface Propuesta {
  id: number;
  titulo: string;
  sector_id: number;
  problematica: string;
  estado_id: number;
  solicitante: number;
  cirRevisorId: number | null;
  citJustificacion: string | null;
  citFechaRevision: string | null;
  createdAt: string;
  Solicitante?: Usuario;
  Revisor?: Usuario;
  Sector?: Sector;
  Estado?: Estado;
}
