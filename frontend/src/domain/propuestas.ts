/**
 * Contratos de dominio y DTOs para el módulo de Propuestas y Revisión Interna (Solicitudes).
 */

import type { Estado, EstadoDTO, Sector, SectorDTO } from "./catalogos";
import type { Servicio, ServicioDTO, Usuario, UsuarioResumenDTO } from "./servicios";

export type DecisionDictamen = "APROBADO" | "ACEPTADA" | "RECHAZADO";

export interface PropuestaDTO {
  id: number;
  titulo: string;
  sector_id: number;
  problematica: string;
  estado_id: number;
  solicitante: number;
  nombre_organismo?: string | null;
  email_contacto?: string | null;
  telefono_contacto?: string | null;
  bienes_recursos?: string | null;
  documento_url?: string | null;
  documento_nombre?: string | null;
  servicio_generado_id?: number | null;
  cirRevisorId: number | null;
  citJustificacion: string | null;
  citFechaRevision: string | null;
  createdAt: string;
  Solicitante?: UsuarioResumenDTO;
  Revisor?: UsuarioResumenDTO;
  Sector?: SectorDTO;
  Estado?: EstadoDTO;
  ServicioGenerado?: ServicioDTO;
}

export interface PropuestasListResponseDTO {
  ok?: boolean;
  total?: number;
  data: PropuestaDTO[];
}

export interface PropuestaItemResponseDTO {
  ok?: boolean;
  data: PropuestaDTO;
}

export interface PropuestaMutationResponseDTO {
  ok?: boolean;
  msg: string;
  data?: PropuestaDTO;
}

export interface Propuesta {
  id: number;
  titulo: string;
  sector_id: number;
  problematica: string;
  estado_id: number;
  solicitante: number;
  nombre_organismo: string | null;
  email_contacto: string | null;
  telefono_contacto: string | null;
  bienes_recursos: string | null;
  documento_url: string | null;
  documento_nombre: string | null;
  servicio_generado_id: number | null;
  cirRevisorId: number | null;
  citJustificacion: string | null;
  citFechaRevision: string | null;
  createdAt: string;
  Solicitante?: Usuario;
  Revisor?: Usuario;
  Sector?: Sector;
  Estado?: Estado;
  ServicioGenerado?: Servicio;
}

export interface CrearPropuestaInput {
  titulo: string;
  sector: string;
  problematica: string;
  nombre_organismo?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  bienes_recursos?: string;
  documento_url?: string;
  documento_nombre?: string;
  documentoFile?: File | null;
}

export interface OpcionesServicioPropuestaInput {
  servicio_nombre?: string;
  servicio_description?: string;
  servicio_precio?: number;
  servicio_img?: string;
}
