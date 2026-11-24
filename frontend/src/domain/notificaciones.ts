/**
 * Contratos de dominio y DTOs para el Centro de Notificaciones y Preferencias (Nivel 5).
 */

export type TipoNotificacion =
  | "NUEVA_PUBLICACION"
  | "CAMBIO_ESTADO_PROPUESTA"
  | "NUEVO_SERVICIO"
  | "ACTUALIZACION_PLATAFORMA"
  | "ACTIVIDAD_USUARIO";

export interface NotificacionItem {
  id: number;
  user_id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  referencia_tipo: string | null;
  referencia_id: number | null;
  leida: boolean;
  fecha_lectura: string | null;
  createdAt: string;
}

export interface NotificacionesListResponseDTO {
  ok?: boolean;
  unreadCount: number;
  total: number;
  data: NotificacionItem[];
}

export interface PreferenciasNotificacion {
  id?: number;
  user_id?: number;
  noticias_publicaciones: boolean;
  cambios_propuestas: boolean;
  nuevos_servicios: boolean;
  actualizaciones_plataforma: boolean;
  actividad_usuario: boolean;
  canal_whatsapp: boolean;
}

export interface PreferenciasNotificacionResponseDTO {
  ok?: boolean;
  msg?: string;
  data: PreferenciasNotificacion;
}

export interface CrearAnuncioInput {
  titulo: string;
  mensaje: string;
  enlace?: string;
}
