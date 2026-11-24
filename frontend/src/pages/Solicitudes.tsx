import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "../components/ui/Alert";
import { Badge, badgeVariantPorEstado } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchFilterBar } from "../components/ui/SearchFilterBar";
import { Skeleton } from "../components/ui/Skeleton";
import {
  StatusTimeline,
  buildPropuestaTimelineSteps,
  buildSolicitudTimelineSteps,
} from "../components/ui/StatusTimeline";
import { useAuth } from "../context/useAuth";
import type { Propuesta, Sector, Solicitud } from "../domain/entidades";
import { getApiError } from "../domain/errors";
import { esPersonalCIT } from "../domain/roles";
import {
  formatearFecha,
  formatearPrecio,
  obtenerNombreVisible,
} from "../lib/formatters";
import { getSectores } from "../services/catalogosService";
import {
  deletePropuesta,
  dictaminarPropuesta,
  getPropuestas,
  tomarPropuestaEnRevision,
} from "../services/propuestasService";
import {
  deleteSolicitud,
  getSolicitudes,
  subirResultadoSolicitud,
  updateSolicitudEstado,
} from "../services/solicitudesService";

type TabBandejaCIT = "propuestas" | "servicios";
type OrdenListado = "recientes" | "antiguas" | "titulo";
type DecisionRevision = "ACEPTADA" | "RECHAZADO";

const MINIMO_JUSTIFICACION = 15;
const MAX_RESULTADO_BYTES = 5 * 1024 * 1024;
const EXTENSIONES_RESULTADO = [".pdf", ".png", ".jpg", ".jpeg"];

const obtenerNombreOrganismo = (propuesta: Propuesta): string => {
  if (propuesta.nombre_organismo?.trim()) {
    return propuesta.nombre_organismo.trim();
  }
  if (propuesta.Solicitante) {
    return obtenerNombreVisible({
      nombre: propuesta.Solicitante.Profile?.first_name,
      apellido: propuesta.Solicitante.Profile?.last_name,
      username: propuesta.Solicitante.username,
    });
  }
  return `Organismo #${propuesta.solicitante}`;
};

const obtenerEmailOrganismo = (propuesta: Propuesta): string =>
  propuesta.email_contacto?.trim() ||
  propuesta.Solicitante?.email ||
  "No especificado";

const normalizarCodigoEstado = (codigo?: string | null): string => {
  const upper = (codigo ?? "PENDIENTE").toUpperCase();
  if (upper === "APROBADO") return "ACEPTADA";
  return upper;
};

const etiquetaEstadoRevision = (propuesta: Propuesta): string => {
  const codigo = normalizarCodigoEstado(propuesta.Estado?.codigo);
  if (codigo === "EN_REVISION") return "En revisión";
  if (codigo === "ACEPTADA") return "Aceptada";
  if (codigo === "RECHAZADO") return "Rechazada";
  return propuesta.Estado?.nombre || "Pendiente";
};

export default function Solicitudes() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [tabActiva, setTabActiva] = useState<TabBandejaCIT>("propuestas");
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [solicitudesServicio, setSolicitudesServicio] = useState<Solicitud[]>(
    [],
  );
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filtros y ordenamiento
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [orden, setOrden] = useState<OrdenListado>("recientes");

  // Propuesta seleccionada para ver detalle y revisar
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);

  // Estado del formulario de revisión y publicación de servicio
  const [tomandoRevision, setTomandoRevision] = useState(false);
  const [decision, setDecision] = useState<DecisionRevision | "">("");
  const [justificacion, setJustificacion] = useState("");
  const [servicioNombre, setServicioNombre] = useState("");
  const [servicioDescripcion, setServicioDescripcion] = useState("");
  const [servicioPrecio, setServicioPrecio] = useState("0");
  const [procesandoDictamen, setProcesandoDictamen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Gestión de Solicitudes de Servicios y Entrega Digital de Resultados (Nivel 2)
  const [updatingSolicitudId, setUpdatingSolicitudId] = useState<number | null>(
    null,
  );
  const [deletingSolicitudId, setDeletingSolicitudId] = useState<number | null>(
    null,
  );
  const [solicitudResultadoModal, setSolicitudResultadoModal] =
    useState<Solicitud | null>(null);
  const [archivoResultado, setArchivoResultado] = useState<File | null>(null);
  const [observacionesResultado, setObservacionesResultado] = useState("");
  const [subiendoResultado, setSubiendoResultado] = useState(false);

  const loadData = useCallback(async () => {
    if (!isCIT) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [propuestasData, sectoresData, solicitudesData] = await Promise.all([
        getPropuestas(),
        getSectores(),
        getSolicitudes().catch(() => [] as Solicitud[]),
      ]);
      setPropuestas(propuestasData);
      setSectores(sectoresData);
      setSolicitudesServicio(solicitudesData);
    } catch (err) {
      setError(
        getApiError(err, "No se pudieron cargar las propuestas recibidas."),
      );
    } finally {
      setLoading(false);
    }
  }, [isCIT]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const propuestaSeleccionada = useMemo(
    () => propuestas.find((p) => p.id === seleccionadaId) ?? null,
    [propuestas, seleccionadaId],
  );

  // Sincronizar campos del formulario de aceptación al abrir una propuesta
  const abrirDetalle = (propuesta: Propuesta) => {
    setSeleccionadaId(propuesta.id);
    setDecision("");
    setJustificacion(propuesta.citJustificacion ?? "");
    setServicioNombre(propuesta.titulo);
    setServicioDescripcion(propuesta.problematica.slice(0, 350));
    setServicioPrecio("0");
    setError("");
    setFeedback("");
  };

  const propuestasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtradas = propuestas.filter((prop) => {
      const codigoEstado = normalizarCodigoEstado(prop.Estado?.codigo);
      const coincideEstado = !estadoFilter || codigoEstado === estadoFilter;
      const coincideSector =
        !sectorFilter || prop.Sector?.codigo === sectorFilter;

      const organismo = obtenerNombreOrganismo(prop).toLowerCase();
      const coincideTexto =
        !q ||
        prop.titulo.toLowerCase().includes(q) ||
        organismo.includes(q) ||
        prop.problematica.toLowerCase().includes(q) ||
        (prop.Sector?.nombre.toLowerCase().includes(q) ?? false);

      return coincideEstado && coincideSector && coincideTexto;
    });

    return [...filtradas].sort((a, b) => {
      if (orden === "titulo") {
        return a.titulo.localeCompare(b.titulo, "es");
      }
      const fechaA = new Date(a.createdAt).getTime();
      const fechaB = new Date(b.createdAt).getTime();
      return orden === "antiguas" ? fechaA - fechaB : fechaB - fechaA;
    });
  }, [propuestas, searchQuery, estadoFilter, sectorFilter, orden]);

  const handleTomarParaRevision = async (propuesta: Propuesta) => {
    setError("");
    setFeedback("");
    setTomandoRevision(true);
    try {
      const res = await tomarPropuestaEnRevision(propuesta.id);
      if (res.data) {
        setPropuestas((prev) =>
          prev.map((item) => (item.id === propuesta.id ? res.data! : item)),
        );
      } else {
        await loadData();
      }
      setFeedback(
        res.msg ||
          `La propuesta "${propuesta.titulo}" pasó al estado En revisión.`,
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo tomar la propuesta para revisión."),
      );
    } finally {
      setTomandoRevision(false);
    }
  };

  const handleConfirmarDecision = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!propuestaSeleccionada) return;

    setError("");
    setFeedback("");

    if (!decision) {
      setError("Seleccioná si aceptás o rechazás la propuesta.");
      return;
    }

    const justificacionLimpia = justificacion.trim();
    if (justificacionLimpia.length < MINIMO_JUSTIFICACION) {
      setError(
        `La justificación técnica debe tener al menos ${MINIMO_JUSTIFICACION} caracteres.`,
      );
      return;
    }

    if (decision === "ACEPTADA") {
      if (!servicioNombre.trim() || !servicioDescripcion.trim()) {
        setError(
          "Completá el nombre y la descripción del servicio antes de publicarlo en el catálogo.",
        );
        return;
      }
      const precioNum = Number(servicioPrecio);
      if (!Number.isFinite(precioNum) || precioNum < 0) {
        setError("El arancel del servicio debe ser mayor o igual a 0.");
        return;
      }
    }

    setProcesandoDictamen(true);
    try {
      const res = await dictaminarPropuesta(
        propuestaSeleccionada.id,
        decision,
        justificacionLimpia,
        decision === "ACEPTADA"
          ? {
              servicio_nombre: servicioNombre.trim(),
              servicio_description: servicioDescripcion.trim(),
              servicio_precio: Number(servicioPrecio),
            }
          : undefined,
      );

      if (res.data) {
        setPropuestas((prev) =>
          prev.map((item) =>
            item.id === propuestaSeleccionada.id ? res.data! : item,
          ),
        );
      } else {
        await loadData();
      }

      setDecision("");
      setFeedback(
        decision === "ACEPTADA"
          ? `Propuesta aceptada e incorporada exitosamente al catálogo de Servicios.`
          : `Propuesta rechazada con dictamen registrado.`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar la decisión de revisión."));
    } finally {
      setProcesandoDictamen(false);
    }
  };

  const handleDeletePropuesta = async (propuesta: Propuesta) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar permanentemente la propuesta "${propuesta.titulo}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingId(propuesta.id);
    try {
      await deletePropuesta(propuesta.id);
      setPropuestas((prev) => prev.filter((p) => p.id !== propuesta.id));
      if (seleccionadaId === propuesta.id) {
        setSeleccionadaId(null);
      }
      setFeedback(
        `La propuesta "${propuesta.titulo}" fue eliminada exitosamente.`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la propuesta."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCambiarEstadoSolicitud = async (
    solicitud: Solicitud,
    nuevoEstado: string,
  ) => {
    setError("");
    setFeedback("");
    setUpdatingSolicitudId(solicitud.id);
    try {
      const actualizada = await updateSolicitudEstado(
        solicitud.id,
        nuevoEstado,
      );
      setSolicitudesServicio((prev) =>
        prev.map((item) => (item.id === solicitud.id ? actualizada : item)),
      );
      setFeedback(
        `Estado de la solicitud #${solicitud.id} actualizado a ${
          actualizada.Estado?.nombre || nuevoEstado
        }.`,
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo actualizar el estado de la solicitud."),
      );
    } finally {
      setUpdatingSolicitudId(null);
    }
  };

  const abrirModalResultado = (solicitud: Solicitud) => {
    setError("");
    setFeedback("");
    setArchivoResultado(null);
    setObservacionesResultado(
      solicitud.resultado_observaciones || solicitud.observaciones_cit || "",
    );
    setSolicitudResultadoModal(solicitud);
  };

  const handleArchivoResultadoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setArchivoResultado(null);
      return;
    }

    const lower = file.name.toLowerCase();
    const extOk = EXTENSIONES_RESULTADO.some((ext) => lower.endsWith(ext));
    if (!extOk) {
      setError(
        "Formato no válido. Solo se permiten informes en PDF o imágenes PNG/JPG.",
      );
      e.target.value = "";
      setArchivoResultado(null);
      return;
    }

    if (file.size <= 0 || file.size > MAX_RESULTADO_BYTES) {
      setError("El archivo de resultado no puede superar los 5 MB.");
      e.target.value = "";
      setArchivoResultado(null);
      return;
    }

    setArchivoResultado(file);
  };

  const handleSubirResultado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!solicitudResultadoModal) return;

    if (!archivoResultado) {
      setError(
        "Seleccioná un archivo PDF o imagen con el informe de resultados.",
      );
      return;
    }

    setError("");
    setFeedback("");
    setSubiendoResultado(true);
    try {
      const res = await subirResultadoSolicitud(solicitudResultadoModal.id, {
        archivo: archivoResultado,
        observaciones: observacionesResultado.trim(),
        finalizar: true,
      });

      setSolicitudesServicio((prev) =>
        prev.map((item) =>
          item.id === solicitudResultadoModal.id ? res.data : item,
        ),
      );
      setSolicitudResultadoModal(null);
      setArchivoResultado(null);
      setObservacionesResultado("");
      setFeedback(
        res.msg ||
          "Resultado técnico adjuntado y entregado digitalmente al productor.",
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo adjuntar el resultado a la solicitud."),
      );
    } finally {
      setSubiendoResultado(false);
    }
  };

  const handleEliminarSolicitudCIT = async (solicitud: Solicitud) => {
    const nombre =
      solicitud.Servicio?.servicio_nombre || `Solicitud #${solicitud.id}`;
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar la solicitud "${nombre}"?`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingSolicitudId(solicitud.id);
    try {
      await deleteSolicitud(solicitud.id);
      setSolicitudesServicio((prev) =>
        prev.filter((item) => item.id !== solicitud.id),
      );
      setFeedback(`La solicitud "${nombre}" fue eliminada.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la solicitud."));
    } finally {
      setDeletingSolicitudId(null);
    }
  };

  if (!isCIT) {
    return (
      <Alert variant="error" title="Acceso restringido">
        Este apartado interno está disponible únicamente para administradores y
        personal del CIT.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes y Revisión de Propuestas"
        subtitle="Bandeja interna de administración y personal CIT para evaluar, aceptar o rechazar propuestas presentadas por organismos."
        count={!loading ? propuestas.length : undefined}
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

      {/* Pestañas de bandeja CIT: Propuestas de Organizaciones vs. Solicitudes de Servicios */}
      <div
        role="tablist"
        aria-label="Secciones de bandeja CIT"
        className="flex flex-wrap gap-2 border-b border-[#21262d] pb-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "propuestas"}
          onClick={() => setTabActiva("propuestas")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tabActiva === "propuestas"
              ? "bg-[#238636] text-white"
              : "border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"
          }`}
        >
          Propuestas de Organizaciones ({propuestas.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "servicios"}
          onClick={() => setTabActiva("servicios")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tabActiva === "servicios"
              ? "bg-[#238636] text-white"
              : "border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white"
          }`}
        >
          Solicitudes de Servicios y Resultados ({solicitudesServicio.length})
        </button>
      </div>

      {tabActiva === "propuestas" ? (
        <>
      {/* Barra de búsqueda, filtros por estado/área y ordenamiento */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por organismo, nombre de propuesta o área…"
      >
        <select
          aria-label="Filtrar por estado"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-[#3fb950]"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="ACEPTADA">Aceptada</option>
          <option value="RECHAZADO">Rechazada</option>
        </select>

        <select
          aria-label="Filtrar por área"
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-[#3fb950]"
        >
          <option value="">Todas las áreas</option>
          {sectores.map((sec) => (
            <option key={sec.id} value={sec.codigo}>
              {sec.nombre}
            </option>
          ))}
        </select>

        <select
          aria-label="Ordenar propuestas"
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenListado)}
          className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-[#3fb950]"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguas">Más antiguas</option>
          <option value="titulo">Nombre (A-Z)</option>
        </select>
      </SearchFilterBar>

      {loading ? (
        <Card>
          <Skeleton lines={5} />
        </Card>
      ) : propuestasFiltradas.length === 0 ? (
        <EmptyState
          title={
            propuestas.length === 0
              ? "No hay propuestas registradas en la bandeja"
              : "No se encontraron propuestas con esos criterios"
          }
          description="Las propuestas presentadas por organismos aparecerán listadas aquí para su revisión técnica."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Columna izquierda: Tabla / Listado de propuestas */}
          <div
            className={
              propuestaSeleccionada ? "lg:col-span-7" : "lg:col-span-12"
            }
          >
            <Card noPadding>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d] bg-[#0d1117]/60 text-xs font-semibold uppercase tracking-wide text-[#8b949e]">
                      <th className="px-4 py-3">Organismo</th>
                      <th className="px-4 py-3">Propuesta</th>
                      <th className="px-4 py-3">Área</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]">
                    {propuestasFiltradas.map((propuesta) => {
                      const activa = propuesta.id === seleccionadaId;
                      const codigoNorm = normalizarCodigoEstado(
                        propuesta.Estado?.codigo,
                      );

                      return (
                        <tr
                          key={propuesta.id}
                          className={`transition-colors ${
                            activa
                              ? "bg-[#14351a]/50"
                              : "hover:bg-[#21262d]/50"
                          }`}
                        >
                          <td className="px-4 py-3.5 font-medium text-white">
                            {obtenerNombreOrganismo(propuesta)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-200">
                            {propuesta.titulo}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant="info">
                              {propuesta.Sector?.nombre || "Sin área"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-[#8b949e]">
                            {formatearFecha(propuesta.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={badgeVariantPorEstado(codigoNorm)}>
                              {etiquetaEstadoRevision(propuesta)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant={activa ? "primary" : "secondary"}
                                onClick={() => abrirDetalle(propuesta)}
                              >
                                Revisar detalle
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={deletingId === propuesta.id}
                                onClick={() => void handleDeletePropuesta(propuesta)}
                                aria-label={`Eliminar propuesta ${propuesta.titulo}`}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Columna derecha: Vista de Detalle y Flujo de Revisión */}
          {propuestaSeleccionada && (
            <div className="lg:col-span-5">
              <Card
                header={
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Detalle de Propuesta #{propuestaSeleccionada.id}
                      </span>
                      <Badge
                        variant={badgeVariantPorEstado(
                          normalizarCodigoEstado(
                            propuestaSeleccionada.Estado?.codigo,
                          ),
                        )}
                      >
                        {etiquetaEstadoRevision(propuestaSeleccionada)}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSeleccionadaId(null)}
                      aria-label="Cerrar detalle de propuesta"
                      className="rounded p-1 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                }
              >
                <div className="space-y-5 text-sm">
                  {/* Datos de la Propuesta y del Organismo */}
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {propuestaSeleccionada.titulo}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#8b949e]">
                      Presentada el{" "}
                      {formatearFecha(propuestaSeleccionada.createdAt, "long")}
                    </p>
                  </div>

                  <StatusTimeline
                    ariaLabel={`Línea de seguimiento de ${propuestaSeleccionada.titulo}`}
                    steps={buildPropuestaTimelineSteps(propuestaSeleccionada)}
                  />

                  <div className="grid gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] p-3.5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[#8b949e]">
                        Información del Organismo
                      </p>
                      <p className="mt-0.5 font-semibold text-white">
                        {obtenerNombreOrganismo(propuestaSeleccionada)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#8b949e]">
                        Área orientada
                      </p>
                      <p className="mt-0.5 font-semibold text-[#58a6ff]">
                        {propuestaSeleccionada.Sector?.nombre || "General"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#8b949e]">
                        Correo electrónico
                      </p>
                      <p className="mt-0.5 break-all text-slate-200">
                        {obtenerEmailOrganismo(propuestaSeleccionada)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#8b949e]">
                        Teléfono / WhatsApp
                      </p>
                      <p className="mt-0.5 text-slate-200">
                        {propuestaSeleccionada.telefono_contacto ||
                          "No especificado"}
                      </p>
                    </div>
                  </div>

                  {/* Descripción de utilidad y funciones */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#3fb950]">
                      Descripción de su utilidad y funciones
                    </h3>
                    <p className="mt-1.5 whitespace-pre-line rounded-md border border-[#30363d] bg-[#0d1117]/60 p-3 text-slate-200">
                      {propuestaSeleccionada.problematica}
                    </p>
                  </div>

                  {/* Bienes o recursos que propone */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#3fb950]">
                      Bienes o recursos que propone
                    </h3>
                    <p className="mt-1.5 whitespace-pre-line rounded-md border border-[#30363d] bg-[#0d1117]/60 p-3 text-slate-300">
                      {propuestaSeleccionada.bienes_recursos ||
                        "Sin bienes o recursos adicionales especificados en la presentación."}
                    </p>
                  </div>

                  {/* Archivos adjuntos y documentación */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#3fb950]">
                      Archivos adjuntos y documentación
                    </h3>
                    {propuestaSeleccionada.documento_url ? (
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                        <span className="truncate text-xs font-medium text-white">
                          📄{" "}
                          {propuestaSeleccionada.documento_nombre ||
                            "Documentación técnica adjunta"}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={propuestaSeleccionada.documento_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-xs font-medium text-[#58a6ff] hover:bg-[#30363d]"
                          >
                            Visualizar
                          </a>
                          <a
                            href={propuestaSeleccionada.documento_url}
                            download={
                              propuestaSeleccionada.documento_nombre || true
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-[#238636] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#2ea043]"
                          >
                            Descargar
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-[#8b949e]">
                        No se adjuntaron documentos en esta propuesta.
                      </p>
                    )}
                  </div>

                  {/* Registro de auditoría y trazabilidad con el servicio generado */}
                  {(propuestaSeleccionada.Revisor ||
                    propuestaSeleccionada.citFechaRevision ||
                    propuestaSeleccionada.citJustificacion ||
                    propuestaSeleccionada.servicio_generado_id) && (
                    <div className="space-y-2 rounded-lg border border-[#447232]/50 bg-[#0d2e0f]/40 p-3.5 text-xs">
                      <p className="font-semibold text-[#3fb950]">
                        Trazabilidad de Revisión CIT
                      </p>
                      {propuestaSeleccionada.Revisor && (
                        <p className="text-slate-200">
                          Revisor:{" "}
                          <strong>
                            {obtenerNombreVisible({
                              nombre:
                                propuestaSeleccionada.Revisor.Profile?.first_name,
                              apellido:
                                propuestaSeleccionada.Revisor.Profile?.last_name,
                              username: propuestaSeleccionada.Revisor.username,
                            })}
                          </strong>{" "}
                          (@{propuestaSeleccionada.Revisor.username})
                        </p>
                      )}
                      {propuestaSeleccionada.citFechaRevision && (
                        <p className="text-slate-300">
                          Fecha de actualización:{" "}
                          {formatearFecha(
                            propuestaSeleccionada.citFechaRevision,
                            "long",
                          )}
                        </p>
                      )}
                      {propuestaSeleccionada.citJustificacion && (
                        <p className="text-slate-200">
                          Dictamen técnico:{" "}
                          <em>{propuestaSeleccionada.citJustificacion}</em>
                        </p>
                      )}
                      {propuestaSeleccionada.servicio_generado_id && (
                        <div className="pt-1">
                          <Link
                            to={`/servicios/${propuestaSeleccionada.servicio_generado_id}`}
                            className="inline-flex items-center gap-1 font-semibold text-[#3fb950] underline hover:text-white"
                          >
                            Ver servicio incorporado en el catálogo (ID #
                            {propuestaSeleccionada.servicio_generado_id}) →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones de Revisión (si está PENDIENTE o EN_REVISION) */}
                  {["PENDIENTE", "EN_REVISION"].includes(
                    normalizarCodigoEstado(propuestaSeleccionada.Estado?.codigo),
                  ) && (
                    <div className="space-y-4 border-t border-[#30363d] pt-4">
                      {normalizarCodigoEstado(
                        propuestaSeleccionada.Estado?.codigo,
                      ) === "PENDIENTE" && (
                        <div className="flex items-center justify-between rounded-md border border-[#9e6a03]/40 bg-[#9e6a03]/10 p-3">
                          <span className="text-xs text-[#d29922]">
                            ¿Deseás asignarte esta propuesta e iniciar su análisis?
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={tomandoRevision}
                            onClick={() =>
                              void handleTomarParaRevision(propuestaSeleccionada)
                            }
                          >
                            Tomar para revisión
                          </Button>
                        </div>
                      )}

                      <form
                        onSubmit={handleConfirmarDecision}
                        className="space-y-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-white">
                          Emitir decisión sobre la propuesta
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-xs font-semibold transition-colors ${
                              decision === "ACEPTADA"
                                ? "border-[#3fb950] bg-[#238636]/25 text-white"
                                : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="decision-propuesta"
                              value="ACEPTADA"
                              checked={decision === "ACEPTADA"}
                              onChange={() => setDecision("ACEPTADA")}
                            />
                            Aceptar e incorporar a Servicios
                          </label>

                          <label
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-xs font-semibold transition-colors ${
                              decision === "RECHAZADO"
                                ? "border-[#f85149] bg-[#da3633]/25 text-white"
                                : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="decision-propuesta"
                              value="RECHAZADO"
                              checked={decision === "RECHAZADO"}
                              onChange={() => setDecision("RECHAZADO")}
                            />
                            Rechazar propuesta
                          </label>
                        </div>

                        {decision === "ACEPTADA" && (
                          <div className="space-y-3 rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                            <p className="text-xs font-semibold text-[#3fb950]">
                              Datos del servicio a publicar en el catálogo
                            </p>
                            <div>
                              <label
                                htmlFor="srv-nombre"
                                className="mb-1 block text-xs text-[#8b949e]"
                              >
                                Nombre del servicio *
                              </label>
                              <input
                                id="srv-nombre"
                                required
                                maxLength={120}
                                value={servicioNombre}
                                onChange={(e) =>
                                  setServicioNombre(e.target.value)
                                }
                                className="input-base"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="srv-precio"
                                className="mb-1 block text-xs text-[#8b949e]"
                              >
                                Arancel en ARS (0 para &ldquo;Consultar&rdquo;) *
                              </label>
                              <input
                                id="srv-precio"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={servicioPrecio}
                                onChange={(e) =>
                                  setServicioPrecio(e.target.value)
                                }
                                className="input-base"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="srv-desc"
                                className="mb-1 block text-xs text-[#8b949e]"
                              >
                                Descripción del servicio *
                              </label>
                              <textarea
                                id="srv-desc"
                                rows={2}
                                required
                                maxLength={350}
                                value={servicioDescripcion}
                                onChange={(e) =>
                                  setServicioDescripcion(e.target.value)
                                }
                                className="input-base"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="justificacion-revision"
                            className="mb-1 block text-xs text-[#8b949e]"
                          >
                            Justificación técnica (mínimo {MINIMO_JUSTIFICACION}{" "}
                            caracteres) *
                          </label>
                          <textarea
                            id="justificacion-revision"
                            rows={3}
                            required
                            minLength={MINIMO_JUSTIFICACION}
                            placeholder="Fundamentá técnicamente la aceptación o el rechazo de la propuesta…"
                            value={justificacion}
                            onChange={(e) => setJustificacion(e.target.value)}
                            className="input-base"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          loading={procesandoDictamen}
                        >
                          {procesandoDictamen
                            ? "Registrando decisión…"
                            : "Confirmar decisión"}
                        </Button>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-[#30363d] pt-3">
                    <Button
                      variant="danger"
                      className="w-full"
                      loading={deletingId === propuestaSeleccionada.id}
                      onClick={() => void handleDeletePropuesta(propuestaSeleccionada)}
                    >
                      Eliminar propuesta
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
        </>
      ) : (
        <section
          className="space-y-4"
          aria-label="Gestión de Solicitudes de Servicios y Entrega de Resultados"
        >
          {loading ? (
            <Card>
              <Skeleton lines={4} />
            </Card>
          ) : solicitudesServicio.length === 0 ? (
            <EmptyState
              title="No hay solicitudes de servicios registradas"
              description="Las contrataciones de ensayos, diagnósticos y servicios solicitadas por productores aparecerán aquí para su seguimiento y entrega de informes."
            />
          ) : (
            <div className="grid gap-4">
              {solicitudesServicio.map((sol) => {
                const codigoEstado = (
                  sol.Estado?.codigo ?? "PENDIENTE"
                ).toUpperCase();
                const nombreServicio =
                  sol.Servicio?.servicio_nombre ||
                  `Servicio #${sol.servicio_id}`;
                const nombreSolicitante = sol.Solicitante
                  ? obtenerNombreVisible({
                      nombre: sol.Solicitante.Profile?.first_name,
                      apellido: sol.Solicitante.Profile?.last_name,
                      username: sol.Solicitante.username,
                    })
                  : `Usuario #${sol.user_id}`;

                return (
                  <Card key={sol.id} className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info">
                            {sol.Servicio?.Sector?.nombre || "General"}
                          </Badge>
                          <span className="text-xs font-medium text-[#e6edf3]">
                            Solicitante: {nombreSolicitante}
                            {sol.Solicitante?.email
                              ? ` (${sol.Solicitante.email})`
                              : ""}
                          </span>
                          <span className="text-xs text-[#8b949e]">
                            · Solicitud #{sol.id} ·{" "}
                            {formatearFecha(
                              sol.fecha_solicitud || sol.createdAt,
                            )}
                          </span>
                          {sol.Servicio?.servicio_precio !== undefined && (
                            <span className="text-xs font-medium text-[#3fb950]">
                              · {formatearPrecio(sol.Servicio.servicio_precio)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-[#e6edf3]">
                          {nombreServicio}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                          {sol.Estado?.nombre ?? codigoEstado}
                        </Badge>

                        <select
                          aria-label={`Cambiar estado de solicitud #${sol.id}`}
                          value={codigoEstado}
                          disabled={updatingSolicitudId === sol.id}
                          onChange={(e) =>
                            void handleCambiarEstadoSolicitud(
                              sol,
                              e.target.value,
                            )
                          }
                          className="input-base py-1 text-xs"
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_REVISION">En revisión</option>
                          <option value="ACEPTADA">Aceptada</option>
                          <option value="FINALIZADA">Finalizada</option>
                          <option value="RECHAZADO">Rechazada</option>
                        </select>

                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={() => abrirModalResultado(sol)}
                        >
                          {sol.resultado_archivo_url
                            ? "Actualizar Resultado (PDF)"
                            : "Entregar Resultado (PDF)"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          loading={deletingSolicitudId === sol.id}
                          onClick={() => void handleEliminarSolicitudCIT(sol)}
                          aria-label={`Eliminar solicitud ${nombreServicio}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <StatusTimeline
                      ariaLabel={`Progreso de solicitud #${sol.id}`}
                      steps={buildSolicitudTimelineSteps(sol)}
                    />

                    {sol.resultado_archivo_url && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#238636]/50 bg-[#0d2e0f]/35 p-3 text-xs">
                        <div>
                          <p className="font-semibold text-[#3fb950]">
                            ✓ Informe técnico entregado:{" "}
                            {sol.resultado_nombre || "Resultado.pdf"}
                          </p>
                          {(sol.resultado_observaciones ||
                            sol.observaciones_cit) && (
                            <p className="mt-0.5 text-[#8b949e]">
                              {sol.resultado_observaciones ||
                                sol.observaciones_cit}
                            </p>
                          )}
                        </div>
                        <a
                          href={sol.resultado_archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#58a6ff] hover:underline"
                        >
                          Ver informe entregado ↗
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

      {/* Modal para entregar o actualizar el Resultado Oficial (PDF/imagen) */}
      <Modal
        open={Boolean(solicitudResultadoModal)}
        onClose={() => setSolicitudResultadoModal(null)}
        title={
          solicitudResultadoModal
            ? `Entregar Resultado Oficial — Solicitud #${solicitudResultadoModal.id}`
            : "Entregar Resultado Oficial"
        }
      >
        {solicitudResultadoModal && (
          <form onSubmit={handleSubirResultado} className="space-y-4">
            <div className="rounded-lg border border-[#21262d] bg-[#0d1117] p-3 text-xs">
              <p className="font-semibold text-[#e6edf3]">
                {solicitudResultadoModal.Servicio?.servicio_nombre ||
                  `Servicio #${solicitudResultadoModal.servicio_id}`}
              </p>
              <p className="mt-0.5 text-[#8b949e]">
                Al adjuntar el informe técnico, la solicitud pasará a estado{" "}
                <strong className="text-[#3fb950]">Finalizada</strong> y el productor podrá descargarlo desde{" "}
                <strong>Mis Servicios</strong>.
              </p>
            </div>

            <div>
              <label
                htmlFor="input-archivo-resultado"
                className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
              >
                Informe o certificado oficial (PDF, PNG o JPG — máx. 5 MB) *
              </label>
              <input
                id="input-archivo-resultado"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleArchivoResultadoChange}
                className="block w-full text-xs text-[#8b949e] file:mr-4 file:rounded-md file:border-0 file:bg-[#21262d] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#e6edf3] hover:file:bg-[#30363d]"
              />
              {archivoResultado && (
                <p className="mt-1 text-xs text-[#3fb950]">
                  Archivo seleccionado: {archivoResultado.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-observaciones-resultado"
                className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
              >
                Conclusiones u observaciones técnicas para el productor
              </label>
              <textarea
                id="input-observaciones-resultado"
                rows={3}
                placeholder="Ej.: Análisis NIRS finalizado. Se adjunta certificado con valores de proteína bruta y digestibilidad…"
                value={observacionesResultado}
                onChange={(e) => setObservacionesResultado(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSolicitudResultadoModal(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={subiendoResultado}>
                Confirmar y entregar resultado
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
