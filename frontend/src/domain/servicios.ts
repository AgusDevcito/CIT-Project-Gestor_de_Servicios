/**
 * Contratos de dominio y DTOs para el módulo de Servicios, Contratación y Reseñas.
 */

import type { Sector, SectorDTO } from "./catalogos";
import type { Rol } from "./roles";

export interface PerfilResumenDTO {
  id?: number;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

export interface UsuarioResumenDTO {
  id: number;
  username: string;
  email: string;
  role: Rol;
  Profile?: PerfilResumenDTO | null;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  role: Rol;
  Profile?: PerfilResumenDTO | null;
}

export interface ResenaServicioDTO {
  id: number;
  servicio_id: number;
  user_id: number;
  calificacion: number;
  comentario: string;
  createdAt: string;
  Autor?: UsuarioResumenDTO;
}

export interface ResenaServicio {
  id: number;
  servicio_id: number;
  user_id: number;
  calificacion: number;
  comentario: string;
  createdAt: string;
  Autor?: Usuario;
}

export interface ServicioDTO {
  id: number;
  servicio_nombre: string;
  servicio_description: string;
  servicio_img: string | null;
  sector_id: number;
  servicio_precio: number | string;
  proveedor_id: number;
  createdAt: string;
  Proveedor?: UsuarioResumenDTO;
  Sector?: SectorDTO;
  Resenas?: ResenaServicioDTO[];
}

export interface ServiciosListResponseDTO {
  count?: number;
  data: ServicioDTO[];
}

export interface ServicioItemResponseDTO {
  msg?: string;
  data: ServicioDTO;
}

export interface ResenaItemResponseDTO {
  msg: string;
  data: ResenaServicioDTO;
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
  Resenas?: ResenaServicio[];
  promedioCalificacion?: number | null;
  totalResenas?: number;
}

export interface CrearServicioInput {
  servicio_nombre: string;
  servicio_description: string;
  servicio_precio: number;
  sector: string;
  servicio_img?: string;
}

export interface CrearResenaInput {
  calificacion: number;
  comentario: string;
}
