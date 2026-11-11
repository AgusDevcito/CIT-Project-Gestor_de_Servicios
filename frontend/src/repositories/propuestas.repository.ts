/**
 * Repositorio de Propuestas: acceso a datos HTTP y mapeo DTO → dominio.
 *
 * Encapsula los alias `Solicitante`, `Revisor`, `Sector`, `Estado` y `ServicioGenerado`
 * de Sequelize.
 */

import { http } from "../lib/http";
import type {
  CrearPropuestaInput,
  DecisionDictamen,
  OpcionesServicioPropuestaInput,
  Propuesta,
  PropuestaDTO,
  PropuestaItemResponseDTO,
  PropuestaMutationResponseDTO,
  PropuestasListResponseDTO,
} from "../domain/propuestas";
import { mapearEstado, mapearSector } from "./catalogos.repository";
import { mapearServicio, mapearUsuarioResumen } from "./servicios.repository";

export const mapearPropuesta = (dto: PropuestaDTO): Propuesta => ({
  id: dto.id,
  titulo: dto.titulo,
  sector_id: dto.sector_id,
  problematica: dto.problematica,
  estado_id: dto.estado_id,
  solicitante: dto.solicitante,
  nombre_organismo: dto.nombre_organismo ?? null,
  email_contacto: dto.email_contacto ?? null,
  telefono_contacto: dto.telefono_contacto ?? null,
  bienes_recursos: dto.bienes_recursos ?? null,
  documento_url: dto.documento_url ?? null,
  documento_nombre: dto.documento_nombre ?? null,
  servicio_generado_id: dto.servicio_generado_id ?? null,
  cirRevisorId: dto.cirRevisorId ?? null,
  citJustificacion: dto.citJustificacion ?? null,
  citFechaRevision: dto.citFechaRevision ?? null,
  createdAt: dto.createdAt,
  Solicitante: dto.Solicitante ? mapearUsuarioResumen(dto.Solicitante) : undefined,
  Revisor: dto.Revisor ? mapearUsuarioResumen(dto.Revisor) : undefined,
  Sector: dto.Sector ? mapearSector(dto.Sector) : undefined,
  Estado: dto.Estado ? mapearEstado(dto.Estado) : undefined,
  ServicioGenerado: dto.ServicioGenerado
    ? mapearServicio(dto.ServicioGenerado)
    : undefined,
});

export const listarPropuestas = async (estado?: string): Promise<Propuesta[]> => {
  const params = estado ? { estado } : undefined;
  const { data } = await http.get<PropuestasListResponseDTO>("/propuestas", { params });
  return (data.data ?? []).map(mapearPropuesta);
};

export const obtenerPropuestaPorId = async (id: number): Promise<Propuesta> => {
  const { data } = await http.get<PropuestaItemResponseDTO>(`/propuestas/${id}`);
  return mapearPropuesta(data.data);
};

export const crearPropuesta = async (
  input: CrearPropuestaInput,
): Promise<{ msg: string; data?: Propuesta }> => {
  if (input.documentoFile) {
    const formData = new FormData();
    formData.append("titulo", input.titulo);
    formData.append("sector", input.sector);
    formData.append("problematica", input.problematica);
    if (input.nombre_organismo) {
      formData.append("nombre_organismo", input.nombre_organismo);
    }
    if (input.email_contacto) {
      formData.append("email_contacto", input.email_contacto);
    }
    if (input.telefono_contacto) {
      formData.append("telefono_contacto", input.telefono_contacto);
    }
    if (input.bienes_recursos) {
      formData.append("bienes_recursos", input.bienes_recursos);
    }
    formData.append("documento", input.documentoFile);

    const { data } = await http.post<PropuestaMutationResponseDTO>(
      "/propuesta/crear",
      formData,
    );
    return {
      msg: data.msg,
      data: data.data ? mapearPropuesta(data.data) : undefined,
    };
  }

  const { documentoFile: _omit, ...jsonPayload } = input;
  const { data } = await http.post<PropuestaMutationResponseDTO>(
    "/propuesta/crear",
    jsonPayload,
  );
  return {
    msg: data.msg,
    data: data.data ? mapearPropuesta(data.data) : undefined,
  };
};

export const tomarEnRevision = async (
  id: number,
): Promise<{ msg: string; data?: Propuesta }> => {
  const { data } = await http.patch<PropuestaMutationResponseDTO>(
    `/propuestas/${id}/revision`,
  );
  return {
    msg: data.msg,
    data: data.data ? mapearPropuesta(data.data) : undefined,
  };
};

export const dictaminarPropuesta = async (
  id: number,
  decision: DecisionDictamen,
  justificacion: string,
  opcionesServicio?: OpcionesServicioPropuestaInput,
): Promise<{ msg: string; data?: Propuesta }> => {
  const { data } = await http.post<PropuestaMutationResponseDTO>(
    `/propuestas/dictaminar/${id}`,
    {
      decision,
      justificacion,
      ...opcionesServicio,
    },
  );
  return {
    msg: data.msg,
    data: data.data ? mapearPropuesta(data.data) : undefined,
  };
};
