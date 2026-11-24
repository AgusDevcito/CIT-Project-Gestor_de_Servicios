import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Alert,
  Badge,
  badgeVariantPorEstado,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusTimeline,
  buildSolicitudTimelineSteps,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type { InscripcionCapacitacion, Solicitud } from "../domain/entidades";
import { formatearFecha, formatearPrecio } from "../lib/formatters";
import { getMisCapacitaciones } from "../services/profileService";
import {
  cancelarSolicitud,
  deleteSolicitud,
  getSolicitudes,
} from "../services/solicitudesService";
import { buildCapacitacionTimelineSteps } from "./Capacitaciones";

type TabMisServicios = "todos" | "solicitados" | "capacitaciones";

const etiquetaEstadoInscripcion = (estado?: string | null): string => {
  const upper = (estado ?? "INSCRIPTO").toUpperCase();
  if (upper === "INSCRIPTO") return "Inscripto";
  if (upper === "EN_CURSO") return "En curso";
  if (upper === "FINALIZADO") return "Finalizado";
  return upper;
};

export default function MisServicios() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tabInicial: TabMisServicios =
    tabParam === "capacitaciones"
      ? "capacitaciones"
      : tabParam === "solicitados"
        ? "solicitados"
        : "todos";

  const [tabActiva, setTabActiva] = useState<TabMisServicios>(tabInicial);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [capacitaciones, setCapacitaciones] = useState<
    InscripcionCapacitacion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (
      tabParam === "capacitaciones" ||
      tabParam === "solicitados" ||
      tabParam === "todos"
    ) {
      setTabActiva(tabParam);
    }
  }, [tabParam]);

  const cambiarTab = (nueva: TabMisServicios) => {
    setTabActiva(nueva);
    setSearchParams(nueva === "todos" ? {} : { tab: nueva });
  };

  const cargarDatos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [solicitudesData, capacitacionesData] = await Promise.all([
        getSolicitudes(),
        getMisCapacitaciones().catch(() => [] as InscripcionCapacitacion[]),
      ]);
      const propias = solicitudesData.filter(
        (sol) => !sol.user_id || sol.user_id === user.id,
      );
      setSolicitudes(propias);
      setCapacitaciones(capacitacionesData);
    } catch (err) {
      setError(
        getApiError(
          err,
          "No se pudieron cargar tus servicios contratados y capacitaciones.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const handleCancelarSolicitud = async (solicitud: Solicitud) => {
    const nombre =
      solicitud.Servicio?.servicio_nombre || `Solicitud #${solicitud.id}`;
    if (
      !window.confirm(
        `¿Deseás cancelar tu solicitud pendiente para "${nombre}"?`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setCancelingId(solicitud.id);
    try {
      const res = await cancelarSolicitud(solicitud.id);
      setSolicitudes((prev) =>
        prev.map((item) => (item.id === solicitud.id ? res.data : item)),
      );
      setFeedback(res.msg || `La solicitud para "${nombre}" fue cancelada.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo cancelar la solicitud."));
    } finally {
      setCancelingId(null);
    }
  };

  const handleEliminarSolicitud = async (solicitud: Solicitud) => {
    const nombre =
      solicitud.Servicio?.servicio_nombre || `Solicitud #${solicitud.id}`;
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar el registro de "${nombre}"?`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingId(solicitud.id);
    try {
      await deleteSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((item) => item.id !== solicitud.id));
      setFeedback(`El registro de "${nombre}" fue eliminado.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la solicitud."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  const mostrarSolicitudes =
    tabActiva === "todos" || tabActiva === "solicitados";
  const mostrarCapacitaciones =
    tabActiva === "todos" || tabActiva === "capacitaciones";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Servicios y Capacitaciones"
        subtitle="Seguimiento en tiempo real de los servicios técnicos que contrataste y de las capacitaciones en las que estás inscripto."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton to="/servicios">
              Explorar catálogo de servicios
            </LinkButton>
            <LinkButton to="/capacitaciones" variant="secondary">
              Ver capacitaciones
            </LinkButton>
          </div>
        }
      />

      {error && (
        <Alert variant="error" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {feedback && (
        <Alert variant="success" onDismiss={() => setFeedback("")}>
          {feedback}
        </Alert>
      )}

      {/* Selector de pestañas */}
      <div
        role="tablist"
        aria-label="Secciones de Mis Servicios"
        className="flex flex-wrap gap-2 border-b border-gh-elevated pb-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "todos"}
          onClick={() => cambiarTab("todos")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tabActiva === "todos"
              ? "bg-cit-accent text-white"
              : "border border-gh-border bg-gh-surface text-gh-muted hover:text-white"
          }`}
        >
          Vista completa ({solicitudes.length + capacitaciones.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "solicitados"}
          onClick={() => cambiarTab("solicitados")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tabActiva === "solicitados"
              ? "bg-cit-accent text-white"
              : "border border-gh-border bg-gh-surface text-gh-muted hover:text-white"
          }`}
        >
          Servicios contratados ({solicitudes.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "capacitaciones"}
          onClick={() => cambiarTab("capacitaciones")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tabActiva === "capacitaciones"
              ? "bg-cit-accent text-white"
              : "border border-gh-border bg-gh-surface text-gh-muted hover:text-white"
          }`}
        >
          Capacitaciones inscriptas ({capacitaciones.length})
        </button>
      </div>

      {/* 1. Servicios Contratados */}
      {mostrarSolicitudes && (
        <section className="space-y-4" aria-label="Servicios contratados">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gh-text">
                Servicios contratados
              </h2>
              <p className="text-xs text-gh-muted">
                Solicitudes técnicas presentadas ante los laboratorios y áreas del CIT Formosa.
              </p>
            </div>
            <Badge variant="neutral">{solicitudes.length} solicitudes</Badge>
          </div>

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : solicitudes.length === 0 ? (
            <EmptyState
              title="Aún no contrataste servicios del catálogo"
              description="Explorá el catálogo oficial del CIT para solicitar análisis de laboratorio, diagnósticos o asistencia técnica."
              action={
                <LinkButton to="/servicios">
                  Explorar servicios
                </LinkButton>
              }
            />
          ) : (
            <div className="grid gap-4">
              {solicitudes.map((sol) => {
                const codigoEstado = (
                  sol.Estado?.codigo ?? "PENDIENTE"
                ).toUpperCase();
                const nombreServicio =
                  sol.Servicio?.servicio_nombre ||
                  `Servicio #${sol.servicio_id}`;
                const esPendiente = codigoEstado === "PENDIENTE";

                return (
                  <Card key={sol.id} className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {sol.Servicio?.Sector?.nombre && (
                            <Badge variant="info">
                              {sol.Servicio.Sector.nombre}
                            </Badge>
                          )}
                          {sol.beneficiario_nombre && (
                            <Badge variant="purple">
                              En representación de: {sol.beneficiario_nombre}
                            </Badge>
                          )}
                          <span className="text-xs text-gh-muted">
                            Solicitud #{sol.id} ·{" "}
                            {formatearFecha(
                              sol.fecha_solicitud || sol.createdAt,
                            )}
                          </span>
                          {sol.Servicio?.servicio_precio !== undefined && (
                            <span className="text-xs font-medium text-cit-accent-emphasis">
                              · Arancel:{" "}
                              {formatearPrecio(sol.Servicio.servicio_precio)}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gh-text">
                          <Link
                            to={`/servicios/${sol.servicio_id}`}
                            className="hover:text-status-info hover:underline"
                          >
                            {nombreServicio}
                          </Link>
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                          {sol.Estado?.nombre ?? codigoEstado}
                        </Badge>
                        <LinkButton to={`/servicios/${sol.servicio_id}`} variant="secondary" size="sm">
                          Ver detalle
                        </LinkButton>
                        {esPendiente && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={cancelingId === sol.id}
                            onClick={() => void handleCancelarSolicitud(sol)}
                          >
                            Cancelar solicitud
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          loading={deletingId === sol.id}
                          onClick={() => void handleEliminarSolicitud(sol)}
                          aria-label={`Eliminar solicitud ${nombreServicio}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <StatusTimeline
                      ariaLabel={`Línea de seguimiento de ${nombreServicio}`}
                      steps={buildSolicitudTimelineSteps(sol)}
                    />

                    {sol.resultado_archivo_url && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cit-accent/60 bg-cit-forest/40 p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="success">
                              Informe Técnico Oficial CIT
                            </Badge>
                            {sol.fecha_entrega_resultado && (
                              <span className="text-xs text-gh-muted">
                                Entregado el{" "}
                                {formatearFecha(sol.fecha_entrega_resultado)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gh-text">
                            📄{" "}
                            {sol.resultado_nombre ||
                              `Informe-Resultado-Solicitud-${sol.id}.pdf`}
                          </p>
                          {(sol.resultado_observaciones ||
                            sol.observaciones_cit) && (
                            <p className="text-xs text-gh-muted">
                              {sol.resultado_observaciones ||
                                sol.observaciones_cit}
                            </p>
                          )}
                        </div>

                        <a
                          href={sol.resultado_archivo_url}
                          download={sol.resultado_nombre || true}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-cit-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-cit-accent-hover"
                        >
                          Descargar Resultado Oficial (PDF)
                        </a>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 2. Capacitaciones Inscriptas */}
      {mostrarCapacitaciones && (
        <section className="space-y-4" aria-label="Capacitaciones inscriptas">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gh-text">
                Capacitaciones en las que estoy inscripto
              </h2>
              <p className="text-xs text-gh-muted">
                Talleres, cursos y jornadas formativas del CIT Formosa con tu progreso actual.
              </p>
            </div>
            <Badge variant="neutral">{capacitaciones.length} inscriptas</Badge>
          </div>

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : capacitaciones.length === 0 ? (
            <EmptyState
              title="No estás inscripto en capacitaciones todavía"
              description="Inscribite en talleres y jornadas técnicas desde la nueva sección de Capacitaciones."
              action={
                <LinkButton to="/capacitaciones">
                  Ir a Capacitaciones
                </LinkButton>
              }
            />
          ) : (
            <div className="grid gap-4">
              {capacitaciones.map((insc) => {
                const tituloCap =
                  insc.Publicacion?.titulo ||
                  `Capacitación #${insc.publicacion_id}`;
                return (
                  <Card key={insc.id} className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {insc.Publicacion?.Sector?.nombre && (
                            <Badge variant="info">
                              {insc.Publicacion.Sector.nombre}
                            </Badge>
                          )}
                          <span className="text-xs text-gh-muted">
                            Inscripto el {formatearFecha(insc.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gh-text">
                          <Link
                            to={`/publicaciones/${insc.publicacion_id}`}
                            className="hover:text-cit-accent-emphasis hover:underline"
                          >
                            {tituloCap}
                          </Link>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            insc.estado === "FINALIZADO"
                              ? "success"
                              : insc.estado === "EN_CURSO"
                                ? "info"
                                : "warning"
                          }
                        >
                          {etiquetaEstadoInscripcion(insc.estado)}
                        </Badge>
                        <LinkButton to={`/publicaciones/${insc.publicacion_id}`} variant="secondary" size="sm">
                          Ver actividad
                        </LinkButton>
                      </div>
                    </div>

                    <StatusTimeline
                      ariaLabel={`Progreso en ${tituloCap}`}
                      steps={buildCapacitacionTimelineSteps(insc)}
                    />
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
