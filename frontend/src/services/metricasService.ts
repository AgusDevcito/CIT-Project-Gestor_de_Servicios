import * as metricasRepository from "../repositories/metricas.repository";
import type { ResumenMetricas } from "../domain/metricas";

export { METRICAS_VACIAS } from "../repositories/metricas.repository";

export const getResumenMetricas = async (): Promise<ResumenMetricas> =>
  metricasRepository.obtenerResumenMetricas();
