import { http } from "../lib/http";
import type { Publicacion, TipoContenido } from "../domain/entidades";

export const getPublicaciones = async (): Promise<Publicacion[]> => {
  const { data } = await http.get<{ data: Publicacion[] }>("/publicaciones");
  return data.data;
};

export const getPublicacionById = async (id: number): Promise<Publicacion> => {
  const { data } = await http.get<{ data: Publicacion }>(`/publicacion/${id}`);
  return data.data;
};

/** Solo personal CIT. */
export const createPublicacion = async (payload: {
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector: string;
}): Promise<void> => {
  await http.post("/publicacion/crear", payload);
};

/** Solo personal CIT. */
export const updatePublicacion = async (
  id: number,
  payload: {
    titulo: string;
    contenido: string;
    tipo_contenido: TipoContenido;
    sector: string;
  },
): Promise<void> => {
  await http.put(`/publicacion/${id}`, payload);
};

/** Solo personal CIT. */
export const deletePublicacion = async (id: number): Promise<void> => {
  await http.delete(`/publicacion/${id}`);
};
