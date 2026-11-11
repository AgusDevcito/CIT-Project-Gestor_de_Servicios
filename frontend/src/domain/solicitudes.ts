/**
 * Contratos de dominio y DTOs para el módulo de Solicitudes de Servicio.
 */

import type { Estado, EstadoDTO } from "./catalogos";
import type { Servicio, ServicioDTO, Usuario, UsuarioResumenDTO } from "./servicios";

export interface SolicitudDTO {
  id: number;
  user_id: number;
  servicio_id: number;
  estado_id: number;
  fecha_solicitud: string | null;
  createdAt: string;
  Servicio?: ServicioDTO;
  Estado?: EstadoDTO;
  Solicitante?: UsuarioResumenDTO;
}

export interface SolicitudesListResponseDTO {
  count?: number;
  data: SolicitudDTO[];
}

export interface SolicitudItemResponseDTO {
  msg?: string;
  data: SolicitudDTO;
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
  Solicitante?: Usuario;
}
