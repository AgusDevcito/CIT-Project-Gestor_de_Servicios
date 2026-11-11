/**
 * Repositorio de Servicios: acceso a datos HTTP y mapeo DTO → dominio.
 *
 * Normaliza el precio (`DECIMAL` devuelto como string o number por PostgreSQL),
 * las relaciones `Proveedor`, `Sector` y `Resenas`, y calcula el promedio de
 * calificación cuando existen reseñas.
 */

import { http } from "../lib/http";
import { esRol } from "../domain/roles";
import type {
  CrearResenaInput,
  CrearServicioInput,
  ResenaItemResponseDTO,
  ResenaServicio,
  ResenaServicioDTO,
  Servicio,
  ServicioDTO,
  ServicioItemResponseDTO,
  ServiciosListResponseDTO,
  Usuario,
  UsuarioResumenDTO,
} from "../domain/servicios";
import { mapearSector } from "./catalogos.repository";

export const mapearUsuarioResumen = (dto: UsuarioResumenDTO): Usuario => ({
  id: dto.id,
  username: dto.username,
  email: dto.email,
  role: esRol(dto.role) ? dto.role : "user",
  Profile: dto.Profile ?? null,
});

export const mapearResena = (dto: ResenaServicioDTO): ResenaServicio => ({
  id: dto.id,
  servicio_id: dto.servicio_id,
  user_id: dto.user_id,
  calificacion: Number(dto.calificacion),
  comentario: dto.comentario,
  createdAt: dto.createdAt,
  Autor: dto.Autor ? mapearUsuarioResumen(dto.Autor) : undefined,
});

export const mapearServicio = (dto: ServicioDTO): Servicio => {
  const resenas = (dto.Resenas ?? [])
    .map(mapearResena)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const totalResenas = resenas.length;
  const promedioCalificacion =
    totalResenas > 0
      ? Number(
          (
            resenas.reduce((acc, r) => acc + r.calificacion, 0) / totalResenas
          ).toFixed(1),
        )
      : null;

  return {
    id: dto.id,
    servicio_nombre: dto.servicio_nombre,
    servicio_description: dto.servicio_description,
    servicio_img: dto.servicio_img ?? null,
    sector_id: dto.sector_id,
    servicio_precio: Number(dto.servicio_precio),
    proveedor_id: dto.proveedor_id,
    createdAt: dto.createdAt,
    Proveedor: dto.Proveedor ? mapearUsuarioResumen(dto.Proveedor) : undefined,
    Sector: dto.Sector ? mapearSector(dto.Sector) : undefined,
    Resenas: resenas,
    promedioCalificacion,
    totalResenas,
  };
};

export const listarServicios = async (): Promise<Servicio[]> => {
  const { data } = await http.get<ServiciosListResponseDTO>("/servicios");
  return (data.data ?? []).map(mapearServicio);
};

export const obtenerServicioPorId = async (id: number): Promise<Servicio> => {
  const { data } = await http.get<ServicioItemResponseDTO>(`/servicios/${id}`);
  return mapearServicio(data.data);
};

export const crearServicio = async (input: CrearServicioInput): Promise<Servicio> => {
  const { data } = await http.post<ServicioItemResponseDTO>("/servicios", input);
  return mapearServicio(data.data);
};

export const crearResenaServicio = async (
  servicioId: number,
  input: CrearResenaInput,
): Promise<{ msg: string; data: ResenaServicio }> => {
  const { data } = await http.post<ResenaItemResponseDTO>(
    `/servicios/${servicioId}/resenas`,
    input,
  );
  return {
    msg: data.msg,
    data: mapearResena(data.data),
  };
};
