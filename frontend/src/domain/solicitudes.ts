/**
 * Contratos de dominio y DTOs para el módulo de Solicitudes de Servicio
 * y Entrega Digital de Resultados (Nivel 2).
 */

import type { Estado, EstadoDTO } from "./catalogos";
import type { Servicio, ServicioDTO, Usuario, UsuarioResumenDTO } from "./servicios";

export interface SolicitudDTO {
  id: number;
  user_id: number;
  servicio_id: number;
  estado_id: number;
  fecha_solicitud: string | null;
  observaciones_cit?: string | null;
  fecha_cancelacion?: string | null;
  cancelado_por_id?: number | null;
  resultado_archivo_url?: string | null;
  resultado_nombre?: string | null;
  resultado_observaciones?: string | null;
  fecha_entrega_resultado?: string | null;
  beneficiario_nombre?: string | null;
  beneficiario_dni_cuit?: string | null;
  beneficiario_localidad?: string | null;
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
  observaciones_cit?: string | null;
  fecha_cancelacion?: string | null;
  cancelado_por_id?: number | null;
  resultado_archivo_url?: string | null;
  resultado_nombre?: string | null;
  resultado_observaciones?: string | null;
  fecha_entrega_resultado?: string | null;
  beneficiario_nombre?: string | null;
  beneficiario_dni_cuit?: string | null;
  beneficiario_localidad?: string | null;
  createdAt: string;
  Servicio?: Servicio;
  Estado?: Estado;
  Solicitante?: Usuario;
}

export interface SubirResultadoSolicitudInput {
  archivo: File;
  observaciones?: string;
  finalizar?: boolean;
}
