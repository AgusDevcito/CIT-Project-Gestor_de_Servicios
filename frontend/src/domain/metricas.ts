/**
 * Contratos de dominio y DTOs para el Panel Visual de Métricas (Nivel 3).
 */

export interface DistribucionSolicitudesMetricas {
  pendientes: number;
  en_curso: number;
  finalizadas: number;
  canceladas: number;
}

export interface ResumenMetricas {
  servicios_activos: number;
  solicitudes_totales: number;
  solicitudes_finalizadas: number;
  resultados_entregados: number;
  propuestas_recibidas: number;
  propuestas_convertidas: number;
  capacitaciones_activas: number;
  inscripciones_capacitaciones: number;
  calificacion_promedio: number;
  total_resenas: number;
  distribucion_solicitudes: DistribucionSolicitudesMetricas;
}

export interface ResumenMetricasResponseDTO {
  ok?: boolean;
  data: ResumenMetricas;
}
