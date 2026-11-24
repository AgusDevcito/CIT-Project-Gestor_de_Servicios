import * as notificacionesRepository from "../repositories/notificaciones.repository";
import type {
  CrearAnuncioInput,
  NotificacionItem,
  PreferenciasNotificacion,
} from "../domain/notificaciones";

export { PREFERENCIAS_NOTIFICACION_DEFAULT } from "../repositories/notificaciones.repository";

export const getNotificaciones = async (options?: {
  soloNoLeidas?: boolean;
  limit?: number;
}): Promise<{ unreadCount: number; data: NotificacionItem[] }> =>
  notificacionesRepository.listarNotificaciones(options);

export const marcarNotificacionLeida = async (
  id: number,
): Promise<NotificacionItem> =>
  notificacionesRepository.marcarNotificacionComoLeida(id);

export const marcarTodasNotificacionesLeidas = async (): Promise<{
  msg: string;
  updatedCount?: number;
}> => notificacionesRepository.marcarTodasComoLeidas();

export const getPreferenciasNotificacion =
  async (): Promise<PreferenciasNotificacion> =>
    notificacionesRepository.obtenerPreferenciasNotificacion();

export const updatePreferenciasNotificacion = async (
  payload: Partial<PreferenciasNotificacion>,
): Promise<{ msg: string; data: PreferenciasNotificacion }> =>
  notificacionesRepository.actualizarPreferenciasNotificacion(payload);

export const emitirAnuncioPlataforma = async (
  payload: CrearAnuncioInput,
): Promise<{ msg: string; enviadas?: number }> =>
  notificacionesRepository.publicarAnuncioPlataforma(payload);
