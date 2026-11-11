/**
 * Contratos de dominio y DTOs para el módulo de Publicaciones y Archivos Adjuntos.
 */

import type { Sector, SectorDTO } from "./catalogos";
import type { Usuario, UsuarioResumenDTO } from "./servicios";

export type TipoContenido =
  | "noticia"
  | "jornada"
  | "inscripcion"
  | "capacitacion"
  | "patologia"
  | "enfermedad"
  | "parasito"
  | "plaga"
  | "otro";

export type TipoArchivo = "imagen" | "video";

export interface CategoriaPublicacionMeta {
  codigo: TipoContenido;
  etiqueta: string;
  grupo: "institucional" | "tecnico";
  badgeVariant: "info" | "purple" | "warning" | "success" | "danger" | "neutral";
}

export const CATEGORIAS_PUBLICACION: ReadonlyArray<CategoriaPublicacionMeta> = [
  {
    codigo: "noticia",
    etiqueta: "Noticia",
    grupo: "institucional",
    badgeVariant: "info",
  },
  {
    codigo: "jornada",
    etiqueta: "Anuncio de jornada",
    grupo: "institucional",
    badgeVariant: "purple",
  },
  {
    codigo: "inscripcion",
    etiqueta: "Aviso de inscripción",
    grupo: "institucional",
    badgeVariant: "warning",
  },
  {
    codigo: "capacitacion",
    etiqueta: "Capacitación",
    grupo: "institucional",
    badgeVariant: "success",
  },
  {
    codigo: "patologia",
    etiqueta: "Patología",
    grupo: "tecnico",
    badgeVariant: "danger",
  },
  {
    codigo: "enfermedad",
    etiqueta: "Enfermedad",
    grupo: "tecnico",
    badgeVariant: "danger",
  },
  {
    codigo: "parasito",
    etiqueta: "Parásito",
    grupo: "tecnico",
    badgeVariant: "warning",
  },
  {
    codigo: "plaga",
    etiqueta: "Plaga",
    grupo: "tecnico",
    badgeVariant: "warning",
  },
  {
    codigo: "otro",
    etiqueta: "Otro",
    grupo: "tecnico",
    badgeVariant: "neutral",
  },
];

export const obtenerMetaCategoriaPublicacion = (
  tipo?: TipoContenido | string | null,
): CategoriaPublicacionMeta => {
  const encontrado = CATEGORIAS_PUBLICACION.find((item) => item.codigo === tipo);
  if (encontrado) return encontrado;
  return {
    codigo: "otro",
    etiqueta: tipo ? String(tipo) : "General",
    grupo: "institucional",
    badgeVariant: "neutral",
  };
};

export interface ArchivoPublicacionDTO {
  id: number;
  tipo: TipoArchivo;
  archivo_url: string;
  archivo_nombre: string | null;
  orden: number | null;
  publicacion_id: number;
}

export interface PublicacionDTO {
  id: number;
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector_id: number;
  author_id: number | null;
  publicado?: boolean;
  createdAt: string;
  Autor?: UsuarioResumenDTO;
  Sector?: SectorDTO;
  Archivo?: ArchivoPublicacionDTO[];
}

export interface PublicacionesListResponseDTO {
  count?: number;
  data: PublicacionDTO[];
}

export interface PublicacionItemResponseDTO {
  msg?: string;
  data: PublicacionDTO;
}

export interface ArchivoItemResponseDTO {
  msg?: string;
  data: ArchivoPublicacionDTO;
}

export interface ArchivosListResponseDTO {
  count?: number;
  data: ArchivoPublicacionDTO[];
}

export interface ArchivoPublicacion {
  id: number;
  tipo: TipoArchivo;
  archivo_url: string;
  archivo_nombre: string | null;
  orden: number | null;
  publicacion_id: number;
}

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector_id: number;
  author_id: number | null;
  publicado?: boolean;
  createdAt: string;
  Autor?: Usuario;
  Sector?: Sector;
  Archivo?: ArchivoPublicacion[];
}

export interface GuardarPublicacionInput {
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector: string;
  publicado?: boolean;
  imagen_url?: string;
  archivo_nombre?: string;
  archivo_tipo?: TipoArchivo;
}

export interface CrearArchivoInput {
  tipo: TipoArchivo;
  archivo_url: string;
  archivo_nombre?: string;
  orden?: number;
}
