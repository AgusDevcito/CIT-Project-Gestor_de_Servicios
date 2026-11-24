import type { Propuesta } from "../../domain/propuestas";
import type { Solicitud } from "../../domain/solicitudes";
import { formatearFecha, obtenerNombreVisible } from "../../lib/formatters";

export type TimelineStepStatus =
  | "completed"
  | "current"
  | "upcoming"
  | "rejected"
  | "cancelled";

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  date?: string | null;
  status: TimelineStepStatus;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  ariaLabel?: string;
  className?: string;
}

const STEP_CIRCLE_CLASSES: Record<TimelineStepStatus, string> = {
  completed:
    "border-[#238636] bg-[#238636] text-white shadow-[0_0_0_3px_rgba(46,160,67,0.18)]",
  current:
    "border-[#d29922] bg-[#9e6a03]/30 text-[#d29922] shadow-[0_0_0_3px_rgba(210,153,34,0.2)]",
  upcoming: "border-[#30363d] bg-[#161b22] text-[#8b949e]",
  rejected:
    "border-[#da3633] bg-[#da3633]/25 text-[#f85149] shadow-[0_0_0_3px_rgba(248,81,73,0.18)]",
  cancelled:
    "border-[#8b949e] bg-[#21262d] text-[#8b949e] shadow-[0_0_0_3px_rgba(139,148,158,0.15)]",
};

const STEP_LABEL_CLASSES: Record<TimelineStepStatus, string> = {
  completed: "text-[#3fb950]",
  current: "text-[#d29922]",
  upcoming: "text-[#8b949e]",
  rejected: "text-[#f85149]",
  cancelled: "text-[#8b949e] line-through",
};

function StepIcon({
  status,
  index,
}: {
  status: TimelineStepStatus;
  index: number;
}) {
  if (status === "completed") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
      </svg>
    );
  }
  if (status === "rejected" || status === "cancelled") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
      </svg>
    );
  }
  return <span className="text-[11px] font-bold">{index + 1}</span>;
}

export function StatusTimeline({
  steps,
  ariaLabel = "Línea de seguimiento de estado",
  className = "",
}: StatusTimelineProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={`rounded-xl border border-[#21262d] bg-[#0d1117]/80 p-3.5 ${className}`}
    >
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="relative flex items-start gap-2.5 rounded-lg border border-[#21262d]/80 bg-[#161b22]/60 p-2.5"
          >
            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${STEP_CIRCLE_CLASSES[step.status]}`}
            >
              <StepIcon status={step.status} index={index} />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p
                  className={`text-xs font-semibold leading-tight ${STEP_LABEL_CLASSES[step.status]}`}
                >
                  {step.label}
                </p>
                {step.date && (
                  <span className="text-[10px] text-[#8b949e]">
                    {step.date}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-[11px] leading-snug text-[#8b949e]">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Construye los pasos de seguimiento para una Propuesta organizacional.
 */
export function buildPropuestaTimelineSteps(propuesta: Propuesta): TimelineStep[] {
  const codigo = (propuesta.Estado?.codigo ?? "PENDIENTE").toUpperCase();
  const fechaCreacion = formatearFecha(propuesta.createdAt);
  const fechaRevision = propuesta.citFechaRevision
    ? formatearFecha(propuesta.citFechaRevision)
    : null;
  const revisorNombre = propuesta.Revisor
    ? obtenerNombreVisible({
        nombre: propuesta.Revisor.Profile?.first_name,
        apellido: propuesta.Revisor.Profile?.last_name,
        username: propuesta.Revisor.username,
      })
    : null;

  if (codigo === "CANCELADA" || codigo === "CANCELADO") {
    return [
      {
        id: "enviada",
        label: "1. Presentada",
        date: fechaCreacion,
        description: "Propuesta registrada por tu organización.",
        status: "completed",
      },
      {
        id: "revision",
        label: "2. Evaluación CIT",
        date: fechaRevision,
        description: "Proceso interrumpido a solicitud del autor.",
        status: "cancelled",
      },
      {
        id: "dictamen",
        label: "3. Propuesta cancelada",
        description: "La propuesta fue dada de baja antes del dictamen final.",
        status: "cancelled",
      },
    ];
  }

  if (codigo === "PENDIENTE") {
    return [
      {
        id: "enviada",
        label: "1. Presentada",
        date: fechaCreacion,
        description: "Registrada y en bandeja de ingreso del CIT.",
        status: "completed",
      },
      {
        id: "revision",
        label: "2. En espera de revisión",
        description: "Pendiente de asignación a un evaluador técnico.",
        status: "current",
      },
      {
        id: "dictamen",
        label: "3. Dictamen y catálogo",
        description: "Resolución técnica e incorporación como servicio.",
        status: "upcoming",
      },
    ];
  }

  if (codigo === "EN_REVISION") {
    return [
      {
        id: "enviada",
        label: "1. Presentada",
        date: fechaCreacion,
        description: "Documentación recibida correctamente.",
        status: "completed",
      },
      {
        id: "revision",
        label: "2. En evaluación técnica",
        date: fechaRevision,
        description: revisorNombre
          ? `Evaluador asignado: ${revisorNombre}.`
          : "Analizando viabilidad técnica y equipamiento.",
        status: "current",
      },
      {
        id: "dictamen",
        label: "3. Dictamen y catálogo",
        description: "Próxima emisión de dictamen fundamentado.",
        status: "upcoming",
      },
    ];
  }

  if (codigo === "RECHAZADO" || codigo === "RECHAZADA") {
    return [
      {
        id: "enviada",
        label: "1. Presentada",
        date: fechaCreacion,
        description: "Propuesta recibida.",
        status: "completed",
      },
      {
        id: "revision",
        label: "2. Evaluada por el CIT",
        date: fechaRevision,
        description: revisorNombre
          ? `Revisada por ${revisorNombre}.`
          : "Evaluación técnica completada.",
        status: "completed",
      },
      {
        id: "dictamen",
        label: "3. Dictamen: No aprobada",
        date: fechaRevision,
        description:
          propuesta.citJustificacion ||
          "Consultá las observaciones técnicas del evaluador.",
        status: "rejected",
      },
    ];
  }

  // APROBADO / ACEPTADA
  return [
    {
      id: "enviada",
      label: "1. Presentada",
      date: fechaCreacion,
      description: "Propuesta ingresada al CIT.",
      status: "completed",
    },
    {
      id: "revision",
      label: "2. Evaluada por el CIT",
      date: fechaRevision,
      description: revisorNombre
        ? `Dictaminada por ${revisorNombre}.`
        : "Viabilidad técnica validada.",
      status: "completed",
    },
    {
      id: "dictamen",
      label: "3. Aceptada y en Catálogo",
      date: fechaRevision,
      description: propuesta.servicio_generado_id
        ? `Convertida en Servicio Oficial #${propuesta.servicio_generado_id}.`
        : "Aprobada e incorporada a la oferta institucional.",
      status: "completed",
    },
  ];
}

/**
 * Construye los pasos de seguimiento para una Solicitud de Servicio.
 */
export function buildSolicitudTimelineSteps(solicitud: Solicitud): TimelineStep[] {
  const codigo = (solicitud.Estado?.codigo ?? "PENDIENTE").toUpperCase();
  const fechaSolicitud = formatearFecha(
    solicitud.fecha_solicitud || solicitud.createdAt,
  );
  const fechaCancelacion = solicitud.fecha_cancelacion
    ? formatearFecha(solicitud.fecha_cancelacion)
    : null;

  if (codigo === "CANCELADA" || codigo === "CANCELADO") {
    return [
      {
        id: "solicitada",
        label: "1. Solicitud enviada",
        date: fechaSolicitud,
        description: "Registrada en el sistema del CIT.",
        status: "completed",
      },
      {
        id: "ejecucion",
        label: "2. Coordinación técnica",
        description: "Tramitación detenida.",
        status: "cancelled",
      },
      {
        id: "cierre",
        label: "3. Solicitud cancelada",
        date: fechaCancelacion,
        description: "Cancelada antes de su ejecución.",
        status: "cancelled",
      },
    ];
  }

  if (codigo === "RECHAZADO" || codigo === "RECHAZADA") {
    return [
      {
        id: "solicitada",
        label: "1. Solicitud enviada",
        date: fechaSolicitud,
        description: "Registrada en el sistema del CIT.",
        status: "completed",
      },
      {
        id: "ejecucion",
        label: "2. Revisión técnica",
        description: "Evaluada por el laboratorio del CIT.",
        status: "completed",
      },
      {
        id: "cierre",
        label: "3. Solicitud rechazada",
        description:
          solicitud.observaciones_cit ||
          "No pudo ser procesada en esta instancia.",
        status: "rejected",
      },
    ];
  }

  if (codigo === "PENDIENTE") {
    return [
      {
        id: "solicitada",
        label: "1. Solicitud enviada",
        date: fechaSolicitud,
        description: "Recibida en la bandeja técnica del CIT.",
        status: "completed",
      },
      {
        id: "ejecucion",
        label: "2. Pendiente de asignación",
        description: "En espera de confirmación y turno de laboratorio.",
        status: "current",
      },
      {
        id: "cierre",
        label: "3. Ejecución y resultado",
        description: "Realización del servicio e informe técnico.",
        status: "upcoming",
      },
    ];
  }

  if (
    codigo === "EN_REVISION" ||
    codigo === "APROBADO" ||
    codigo === "ACEPTADA"
  ) {
    return [
      {
        id: "solicitada",
        label: "1. Solicitud enviada",
        date: fechaSolicitud,
        description: "Recepción confirmada.",
        status: "completed",
      },
      {
        id: "ejecucion",
        label: "2. En curso / Aprobada",
        description:
          solicitud.observaciones_cit ||
          "El equipo del CIT está coordinando o ejecutando el servicio.",
        status: "current",
      },
      {
        id: "cierre",
        label: "3. Finalización e informe",
        description: "Emisión de resultados técnicos finales.",
        status: "upcoming",
      },
    ];
  }

  // FINALIZADA (o con resultado oficial entregado)
  const fechaEntrega = solicitud.fecha_entrega_resultado
    ? formatearFecha(solicitud.fecha_entrega_resultado)
    : null;
  const tieneResultado = Boolean(solicitud.resultado_archivo_url);

  return [
    {
      id: "solicitada",
      label: "1. Solicitud enviada",
      date: fechaSolicitud,
      description: "Recepción confirmada.",
      status: "completed",
    },
    {
      id: "ejecucion",
      label: "2. Ejecución técnica",
      description: "Servicio y ensayos realizados por el CIT.",
      status: "completed",
    },
    {
      id: "cierre",
      label: tieneResultado
        ? "3. Resultado Oficial Entregado"
        : "3. Servicio finalizado",
      date: fechaEntrega,
      description:
        solicitud.resultado_observaciones ||
        solicitud.observaciones_cit ||
        (solicitud.resultado_nombre
          ? `Informe disponible: ${solicitud.resultado_nombre}`
          : "Servicio completado satisfactoriamente."),
      status: "completed",
    },
  ];
}
