import { http } from "../lib/http";
import type {
  ResumenMetricas,
  ResumenMetricasResponseDTO,
} from "../domain/metricas";

export const METRICAS_VACIAS: ResumenMetricas = {
  servicios_activos: 0,
  solicitudes_totales: 0,
  solicitudes_finalizadas: 0,
  resultados_entregados: 0,
  propuestas_recibidas: 0,
  propuestas_convertidas: 0,
  capacitaciones_activas: 0,
  inscripciones_capacitaciones: 0,
  calificacion_promedio: 0,
  total_resenas: 0,
  distribucion_solicitudes: {
    pendientes: 0,
    en_curso: 0,
    finalizadas: 0,
    canceladas: 0,
  },
};

export const obtenerResumenMetricas = async (): Promise<ResumenMetricas> => {
  const { data } =
    await http.get<ResumenMetricasResponseDTO>("/metricas/resumen");
  return data.data ?? METRICAS_VACIAS;
};
