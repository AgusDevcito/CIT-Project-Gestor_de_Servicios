import { http } from "../lib/http";
import type { Propuesta } from "../domain/entidades";

/** Solo CIT: devuelve las propuestas con estado PENDIENTE. */
export const getPropuestasPendientes = async (): Promise<Propuesta[]> => {
  const { data } = await http.get<{ data: Propuesta[] }>("/propuestas");
  return data.data;
};

/** Solo usuario normal: crea una nueva problemática a resolver. */
export const crearPropuesta = async (payload: {
  titulo: string;
  sector: string;
  problematica: string;
}): Promise<{ msg: string }> => {
  const { data } = await http.post<{ msg: string }>("/propuesta/crear", payload);
  return data;
};

/** Solo CIT: decisión "APROBADO" | "RECHAZADO" con justificación (mín. 15 caracteres). */
export const dictaminarPropuesta = async (
  id: number,
  decision: "APROBADO" | "RECHAZADO",
  justificacion: string,
): Promise<{ msg: string }> => {
  const { data } = await http.post<{ msg: string }>(`/propuestas/dictaminar/${id}`, {
    decision,
    justificacion,
  });
  return data;
};
