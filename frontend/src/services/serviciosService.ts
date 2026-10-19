import { http } from "../lib/http";
import type { Servicio } from "../domain/entidades";

export const getServicios = async (): Promise<Servicio[]> => {
  const { data } = await http.get<{ data: Servicio[] }>("/servicios");
  return data.data;
};

/** Solo personal CIT. */
export const createServicio = async (payload: {
  servicio_nombre: string;
  servicio_description: string;
  servicio_precio: number;
  sector: string;
  servicio_img?: string;
}): Promise<void> => {
  await http.post("/servicios", payload);
};
