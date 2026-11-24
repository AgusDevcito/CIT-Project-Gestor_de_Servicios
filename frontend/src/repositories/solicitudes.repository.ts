/**
 * Repositorio de Solicitudes: acceso a datos HTTP y mapeo DTO → dominio.
 *
 * Encapsula los alias `Servicio`, `Estado` y `Solicitante` de Sequelize,
 * así como la entrega digital de resultados técnicos (Nivel 2).
 */

import { http } from "../lib/http";
import type {
  Solicitud,
  SolicitudDTO,
  SolicitudItemResponseDTO,
  SolicitudesListResponseDTO,
  SubirResultadoSolicitudInput,
} from "../domain/solicitudes";
import { mapearEstado } from "./catalogos.repository";
import { mapearServicio, mapearUsuarioResumen } from "./servicios.repository";

export const mapearSolicitud = (dto: SolicitudDTO): Solicitud => ({
  id: dto.id,
  user_id: dto.user_id,
  servicio_id: dto.servicio_id,
  estado_id: dto.estado_id,
  fecha_solicitud: dto.fecha_solicitud ?? null,
  observaciones_cit: dto.observaciones_cit ?? null,
  fecha_cancelacion: dto.fecha_cancelacion ?? null,
  cancelado_por_id: dto.cancelado_por_id ?? null,
  resultado_archivo_url: dto.resultado_archivo_url ?? null,
  resultado_nombre: dto.resultado_nombre ?? null,
  resultado_observaciones: dto.resultado_observaciones ?? null,
  fecha_entrega_resultado: dto.fecha_entrega_resultado ?? null,
  beneficiario_nombre: dto.beneficiario_nombre ?? null,
  beneficiario_dni_cuit: dto.beneficiario_dni_cuit ?? null,
  beneficiario_localidad: dto.beneficiario_localidad ?? null,
  createdAt: dto.createdAt,
  Servicio: dto.Servicio ? mapearServicio(dto.Servicio) : undefined,
  Estado: dto.Estado ? mapearEstado(dto.Estado) : undefined,
  Solicitante: dto.Solicitante ? mapearUsuarioResumen(dto.Solicitante) : undefined,
});

export const listarSolicitudes = async (): Promise<Solicitud[]> => {
  const { data } = await http.get<SolicitudesListResponseDTO>("/solicitudes");
  return (data.data ?? []).map(mapearSolicitud);
};

export const crearSolicitud = async (
  servicioId: number,
  beneficiario?: {
    beneficiario_nombre?: string;
    beneficiario_dni_cuit?: string;
    beneficiario_localidad?: string;
  },
): Promise<Solicitud> => {
  const { data } = await http.post<SolicitudItemResponseDTO>("/solicitudes", {
    servicio_id: servicioId,
    ...(beneficiario?.beneficiario_nombre
      ? { beneficiario_nombre: beneficiario.beneficiario_nombre }
      : {}),
    ...(beneficiario?.beneficiario_dni_cuit
      ? { beneficiario_dni_cuit: beneficiario.beneficiario_dni_cuit }
      : {}),
    ...(beneficiario?.beneficiario_localidad
      ? { beneficiario_localidad: beneficiario.beneficiario_localidad }
      : {}),
  });
  return mapearSolicitud(data.data);
};

export const actualizarEstadoSolicitud = async (
  id: number,
  estadoCodigo: string,
  observacionesCit?: string,
): Promise<Solicitud> => {
  const { data } = await http.patch<SolicitudItemResponseDTO>(
    `/solicitudes/${id}/estado`,
    {
      estado: estadoCodigo,
      ...(observacionesCit !== undefined
        ? { observaciones_cit: observacionesCit }
        : {}),
    },
  );
  return mapearSolicitud(data.data);
};

export const subirResultadoSolicitud = async (
  id: number,
  input: SubirResultadoSolicitudInput,
): Promise<{ msg: string; data: Solicitud }> => {
  const formData = new FormData();
  formData.append("resultado", input.archivo);
  if (input.observaciones !== undefined) {
    formData.append("resultado_observaciones", input.observaciones);
  }
  if (input.finalizar !== undefined) {
    formData.append("finalizar", String(input.finalizar));
  }

  const { data } = await http.post<SolicitudItemResponseDTO>(
    `/solicitudes/${id}/resultado`,
    formData,
  );
  return {
    msg:
      data.msg ||
      "Resultado técnico adjuntado y entregado digitalmente al solicitante.",
    data: mapearSolicitud(data.data),
  };
};

export const cancelarSolicitud = async (
  id: number,
): Promise<{ msg: string; data: Solicitud }> => {
  const { data } = await http.patch<SolicitudItemResponseDTO>(
    `/solicitudes/${id}/cancelar`,
  );
  return {
    msg: data.msg || "Solicitud cancelada correctamente.",
    data: mapearSolicitud(data.data),
  };
};

export const eliminarSolicitud = async (
  id: number,
): Promise<{ msg: string }> => {
  const { data } = await http.delete<{ msg: string }>(`/solicitudes/${id}`);
  return data;
};
