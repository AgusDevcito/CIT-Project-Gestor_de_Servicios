import { http } from "../lib/http";
import type {
  CrearAnuncioInput,
  NotificacionItem,
  NotificacionesListResponseDTO,
  PreferenciasNotificacion,
  PreferenciasNotificacionResponseDTO,
} from "../domain/notificaciones";

export const PREFERENCIAS_NOTIFICACION_DEFAULT: PreferenciasNotificacion = {
  noticias_publicaciones: true,
  cambios_propuestas: true,
  nuevos_servicios: true,
  actualizaciones_plataforma: true,
  actividad_usuario: true,
  canal_whatsapp: true,
};

export const listarNotificaciones = async (options?: {
  soloNoLeidas?: boolean;
  limit?: number;
}): Promise<{ unreadCount: number; data: NotificacionItem[] }> => {
  const params: Record<string, string | number> = {};
  if (options?.soloNoLeidas) params.soloNoLeidas = "true";
  if (options?.limit) params.limit = options.limit;

  const { data } = await http.get<NotificacionesListResponseDTO>(
    "/notificaciones",
    { params },
  );
  return {
    unreadCount: data.unreadCount ?? 0,
    data: data.data ?? [],
  };
};

export const marcarNotificacionComoLeida = async (
  id: number,
): Promise<NotificacionItem> => {
  const { data } = await http.patch<{ data: NotificacionItem }>(
    `/notificaciones/${id}/leer`,
  );
  return data.data;
};

export const marcarTodasComoLeidas = async (): Promise<{
  msg: string;
  updatedCount?: number;
}> => {
  const { data } = await http.patch<{ msg: string; updatedCount?: number }>(
    "/notificaciones/leer-todas",
  );
  return data;
};

export const obtenerPreferenciasNotificacion =
  async (): Promise<PreferenciasNotificacion> => {
    const { data } = await http.get<PreferenciasNotificacionResponseDTO>(
      "/notificaciones/preferencias",
    );
    return {
      ...PREFERENCIAS_NOTIFICACION_DEFAULT,
      ...(data.data ?? {}),
    };
  };

export const actualizarPreferenciasNotificacion = async (
  payload: Partial<PreferenciasNotificacion>,
): Promise<{ msg: string; data: PreferenciasNotificacion }> => {
  const { data } = await http.put<PreferenciasNotificacionResponseDTO>(
    "/notificaciones/preferencias",
    payload,
  );
  return {
    msg:
      data.msg ||
      "Preferencias de notificaciones actualizadas correctamente.",
    data: {
      ...PREFERENCIAS_NOTIFICACION_DEFAULT,
      ...(data.data ?? {}),
    },
  };
};

export const publicarAnuncioPlataforma = async (
  payload: CrearAnuncioInput,
): Promise<{ msg: string; enviadas?: number }> => {
  const { data } = await http.post<{ msg: string; enviadas?: number }>(
    "/notificaciones/anuncio",
    payload,
  );
  return data;
};
