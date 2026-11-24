import { Op } from "sequelize";
import {
    Estado,
    InscripcionCapacitacion,
    Propuesta,
    Publicacion,
    ResenaServicio,
    Servicio,
    Solicitud,
} from "../models/index.js";

export interface ResumenMetricasDTO {
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
    distribucion_solicitudes: {
        pendientes: number;
        en_curso: number;
        finalizadas: number;
        canceladas: number;
    };
}

export const obtenerResumenMetricas = async (): Promise<ResumenMetricasDTO> => {
    const [
        serviciosActivos,
        solicitudes,
        propuestasRecibidas,
        propuestasConvertidas,
        capacitacionesActivas,
        inscripcionesCapacitaciones,
        resenas,
    ] = await Promise.all([
        Servicio.count(),
        Solicitud.findAll({
            include: [{ model: Estado, as: "Estado" }],
        }),
        Propuesta.count(),
        Propuesta.count({
            where: {
                servicio_generado_id: { [Op.ne]: null },
            },
        }),
        Publicacion.count({
            where: {
                publicado: true,
                tipo_contenido: {
                    [Op.in]: ["capacitacion", "jornada", "inscripcion"],
                },
            },
        }),
        InscripcionCapacitacion.count(),
        ResenaServicio.findAll({
            attributes: ["calificacion"],
        }),
    ]);

    let pendientes = 0;
    let enCurso = 0;
    let finalizadas = 0;
    let canceladas = 0;
    let resultadosEntregados = 0;

    for (const sol of solicitudes) {
        const codigo = (sol.Estado?.codigo ?? "PENDIENTE").toUpperCase();
        if (sol.resultado_archivo_url) {
            resultadosEntregados += 1;
        }
        if (codigo === "PENDIENTE") {
            pendientes += 1;
        } else if (
            codigo === "EN_REVISION" ||
            codigo === "APROBADO" ||
            codigo === "ACEPTADA"
        ) {
            enCurso += 1;
        } else if (codigo === "FINALIZADA") {
            finalizadas += 1;
        } else if (
            codigo === "CANCELADA" ||
            codigo === "CANCELADO" ||
            codigo === "RECHAZADO" ||
            codigo === "RECHAZADA"
        ) {
            canceladas += 1;
        }
    }

    const totalResenas = resenas.length;
    const sumaCalificaciones = resenas.reduce(
        (acc, item) => acc + Number(item.calificacion || 0),
        0,
    );
    const calificacionPromedio =
        totalResenas > 0
            ? Number((sumaCalificaciones / totalResenas).toFixed(1))
            : 0;

    return {
        servicios_activos: serviciosActivos,
        solicitudes_totales: solicitudes.length,
        solicitudes_finalizadas: finalizadas,
        resultados_entregados: resultadosEntregados,
        propuestas_recibidas: propuestasRecibidas,
        propuestas_convertidas: propuestasConvertidas,
        capacitaciones_activas: capacitacionesActivas,
        inscripciones_capacitaciones: inscripcionesCapacitaciones,
        calificacion_promedio: calificacionPromedio,
        total_resenas: totalResenas,
        distribucion_solicitudes: {
            pendientes,
            en_curso: enCurso,
            finalizadas,
            canceladas,
        },
    };
};
