/**
 * Repositorio de Catálogos: acceso a datos HTTP y mapeo DTO → dominio
 * para Sectores y Estados.
 */

import { http } from "../lib/http";
import type {
  CatalogoListResponseDTO,
  Estado,
  EstadoDTO,
  Sector,
  SectorDTO,
} from "../domain/catalogos";

export const mapearSector = (dto: SectorDTO): Sector => ({
  id: dto.id,
  codigo: dto.codigo,
  nombre: dto.nombre,
  activo: Boolean(dto.activo),
});

export const mapearEstado = (dto: EstadoDTO): Estado => ({
  id: dto.id,
  codigo: dto.codigo,
  nombre: dto.nombre,
  activo: Boolean(dto.activo),
});

export const obtenerSectores = async (): Promise<Sector[]> => {
  const { data } = await http.get<CatalogoListResponseDTO<SectorDTO>>("/sectores");
  return (data.data ?? []).map(mapearSector);
};

export const obtenerEstados = async (): Promise<Estado[]> => {
  const { data } = await http.get<CatalogoListResponseDTO<EstadoDTO>>("/estados");
  return (data.data ?? []).map(mapearEstado);
};
