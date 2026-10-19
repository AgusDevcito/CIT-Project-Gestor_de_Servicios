import { http } from "../lib/http";
import type { Solicitud } from "../domain/entidades";

/** Un usuario normal ve solo las suyas; CIT/admin ven todas. */
export const getSolicitudes = async (): Promise<Solicitud[]> => {
  const { data } = await http.get<{ data: Solicitud[] }>("/solicitudes");
  return data.data;
};

export const createSolicitud = async (servicioId: number): Promise<void> => {
  await http.post("/solicitudes", { servicio_id: servicioId });
};

/** Solo admin/CIT: recibe el código del estado (ej. "PENDIENTE", "APROBADO"). */
export const updateSolicitudEstado = async (
  id: number,
  estadoCodigo: string,
): Promise<void> => {
  await http.patch(`/solicitudes/${id}/estado`, { estado: estadoCodigo });
};
