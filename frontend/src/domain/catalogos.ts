/**
 * Contratos de dominio y DTOs para los catálogos maestros (Sectores y Estados).
 */

export interface SectorDTO {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface EstadoDTO {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface CatalogoListResponseDTO<T> {
  count?: number;
  data: T[];
}

export interface Sector {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Estado {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}
