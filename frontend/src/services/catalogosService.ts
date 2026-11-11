/**
 * Servicio de Catálogos: casos de uso para consultar Sectores y Estados.
 */

import * as catalogosRepository from "../repositories/catalogos.repository";
import type { Estado, Sector } from "../domain/catalogos";

export const SECTORES_OFICIALES_CIT: Sector[] = [
  { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
  { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  { id: 3, codigo: "FRUTIHORTICOLA", nombre: "Frutihortícola", activo: true },
];

export const getSectores = async (): Promise<Sector[]> => {
  try {
    const lista = await catalogosRepository.obtenerSectores();
    return lista.length > 0 ? lista : SECTORES_OFICIALES_CIT;
  } catch {
    return SECTORES_OFICIALES_CIT;
  }
};

export const getEstados = async (): Promise<Estado[]> =>
  catalogosRepository.obtenerEstados();
