/**
 * Repositorio de Publicaciones y Archivos Adjuntos: acceso a datos HTTP
 * y mapeo DTO → dominio.
 */

import { http } from "../lib/http";
import type {
  ArchivoItemResponseDTO,
  ArchivoPublicacion,
  ArchivoPublicacionDTO,
  ArchivosListResponseDTO,
  CrearArchivoInput,
  GuardarPublicacionInput,
  Publicacion,
  PublicacionDTO,
  PublicacionesListResponseDTO,
  PublicacionItemResponseDTO,
} from "../domain/publicaciones";
import { mapearSector } from "./catalogos.repository";
import { mapearUsuarioResumen } from "./servicios.repository";

export const mapearArchivo = (dto: ArchivoPublicacionDTO): ArchivoPublicacion => ({
  id: dto.id,
  tipo: dto.tipo,
  archivo_url: dto.archivo_url,
  archivo_nombre: dto.archivo_nombre ?? null,
  orden: dto.orden ?? 0,
  publicacion_id: dto.publicacion_id,
});

export const mapearPublicacion = (dto: PublicacionDTO): Publicacion => ({
  id: dto.id,
  titulo: dto.titulo,
  contenido: dto.contenido,
  tipo_contenido: dto.tipo_contenido,
  sector_id: dto.sector_id,
  author_id: dto.author_id ?? null,
  publicado: typeof dto.publicado === "boolean" ? dto.publicado : true,
  createdAt: dto.createdAt,
  Autor: dto.Autor ? mapearUsuarioResumen(dto.Autor) : undefined,
  Sector: dto.Sector ? mapearSector(dto.Sector) : undefined,
  Archivo: dto.Archivo
    ? [...dto.Archivo]
        .map(mapearArchivo)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id)
    : undefined,
});

export const listarPublicaciones = async (): Promise<Publicacion[]> => {
  const { data } = await http.get<PublicacionesListResponseDTO>("/publicaciones");
  return (data.data ?? []).map(mapearPublicacion);
};

export const obtenerPublicacionPorId = async (id: number): Promise<Publicacion> => {
  const { data } = await http.get<PublicacionItemResponseDTO>(`/publicacion/${id}`);
  return mapearPublicacion(data.data);
};

export const crearPublicacion = async (
  input: GuardarPublicacionInput,
): Promise<Publicacion> => {
  const { data } = await http.post<PublicacionItemResponseDTO>(
    "/publicacion/crear",
    input,
  );
  return mapearPublicacion(data.data);
};

export const actualizarPublicacion = async (
  id: number,
  input: GuardarPublicacionInput,
): Promise<Publicacion> => {
  const { data } = await http.put<PublicacionItemResponseDTO>(
    `/publicacion/${id}`,
    input,
  );
  return mapearPublicacion(data.data);
};

export const cambiarEstadoPublicacion = async (
  id: number,
  publicado?: boolean,
): Promise<Publicacion> => {
  const { data } = await http.patch<PublicacionItemResponseDTO>(
    `/publicacion/${id}/estado`,
    typeof publicado === "boolean" ? { publicado } : {},
  );
  return mapearPublicacion(data.data);
};

export const eliminarPublicacion = async (id: number): Promise<void> => {
  await http.delete(`/publicacion/${id}`);
};

export const listarArchivosPorPublicacion = async (
  publicacionId: number,
): Promise<ArchivoPublicacion[]> => {
  const { data } = await http.get<ArchivosListResponseDTO>(
    `/publicacion/${publicacionId}/archivos`,
  );
  return (data.data ?? [])
    .map(mapearArchivo)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);
};

export const agregarArchivo = async (
  publicacionId: number,
  input: CrearArchivoInput,
): Promise<ArchivoPublicacion> => {
  const { data } = await http.post<ArchivoItemResponseDTO>(
    `/publicacion/${publicacionId}/archivos`,
    input,
  );
  return mapearArchivo(data.data);
};

export const eliminarArchivo = async (archivoId: number): Promise<void> => {
  await http.delete(`/archivo/${archivoId}`);
};
