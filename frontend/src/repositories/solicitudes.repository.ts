/**
 * Repositorio de Solicitudes: acceso a datos HTTP y mapeo DTO → dominio.
 *
 * Encapsula los alias `Servicio`, `Estado` y `Solicitante` de Sequelize.
 */

import { http } from "../lib/http";
import type {
  Solicitud,
  SolicitudDTO,
  SolicitudItemResponseDTO,
  SolicitudesListResponseDTO,
} from "../domain/solicitudes";
import { mapearEstado } from "./catalogos.repository";
import { mapearServicio, mapearUsuarioResumen } from "./servicios.repository";

export const mapearSolicitud = (dto: SolicitudDTO): Solicitud => ({
  id: dto.id,
  user_id: dto.user_id,
  servicio_id: dto.servicio_id,
  estado_id: dto.estado_id,
  fecha_solicitud: dto.fecha_solicitud ?? null,
  createdAt: dto.createdAt,
  Servicio: dto.Servicio ? mapearServicio(dto.Servicio) : undefined,
  Estado: dto.Estado ? mapearEstado(dto.Estado) : undefined,
  Solicitante: dto.Solicitante ? mapearUsuarioResumen(dto.Solicitante) : undefined,
});

export const listarSolicitudes = async (): Promise<Solicitud[]> => {
  const { data } = await http.get<SolicitudesListResponseDTO>("/solicitudes");
  return (data.data ?? []).map(mapearSolicitud);
};

export const crearSolicitud = async (servicioId: number): Promise<Solicitud> => {
  const { data } = await http.post<SolicitudItemResponseDTO>("/solicitudes", {
    servicio_id: servicioId,
  });
  return mapearSolicitud(data.data);
};

export const actualizarEstadoSolicitud = async (
  id: number,
  estadoCodigo: string,
): Promise<Solicitud> => {
  const { data } = await http.patch<SolicitudItemResponseDTO>(
    `/solicitudes/${id}/estado`,
    { estado: estadoCodigo },
  );
  return mapearSolicitud(data.data);
};

export const eliminarSolicitud = async (
  id: number,
): Promise<{ msg: string }> => {
  const { data } = await http.delete<{ msg: string }>(`/solicitudes/${id}`);
  return data;
};
