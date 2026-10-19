import { http } from "../lib/http";
import type { Sector, Estado } from "../domain/entidades";

export const getSectores = async (): Promise<Sector[]> => {
  const { data } = await http.get<{ count: number; data: Sector[] }>("/sectores");
  return data.data;
};

export const getEstados = async (): Promise<Estado[]> => {
  const { data } = await http.get<{ count: number; data: Estado[] }>("/estados");
  return data.data;
};
