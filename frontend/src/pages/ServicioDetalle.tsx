import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert } from "../components/ui/Alert";
import { Badge, badgeVariantPorEstado } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/useAuth";
import type { Servicio, Solicitud } from "../domain/entidades";
import { getApiError } from "../domain/errors";
import { esPersonalCIT } from "../domain/roles";
import {
  formatearFecha,
  formatearPrecio,
  obtenerNombreVisible,
} from "../lib/formatters";
import {
  createResenaServicio,
  getServicioById,
} from "../services/serviciosService";
import { createSolicitud, getSolicitudes } from "../services/solicitudesService";

const ESTADOS_ACTIVOS = new Set(["PENDIENTE", "APROBADO", "ACEPTADA"]);

function EstrellasVisuales({ valor }: { valor: number }) {
  const redondeado = Math.round(valor);
  return (
    <span aria-label={`${valor} de 5 estrellas`} className="inline-flex gap-0.5 text-[#d29922]">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <span key={estrella}>
          {estrella <= redondeado ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export default function ServicioDetalle() {
  const { id } = useParams();
  const servicioId = Number(id);
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Contratación
  const [solicitando, setSolicitando] = useState(false);

  // Formulario de calificación y reseña
  const [calificacion, setCalificacion] = useState<number>(5);
  const [comentario, setComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [errorResena, setErrorResena] = useState("");
  const [feedbackResena, setFeedbackResena] = useState("");

  const cargarDetalle = useCallback(async () => {
    if (!Number.isFinite(servicioId) || servicioId <= 0) {
      setError("El identificador del servicio no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [servicioData, solicitudesData] = await Promise.all([
        getServicioById(servicioId),
        user && !isCIT ? getSolicitudes().catch(() => []) : Promise.resolve([]),
      ]);
      setServicio(servicioData);
      setMisSolicitudes(
        solicitudesData.filter((sol) => sol.servicio_id === servicioId),
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo cargar la información del servicio."));
    } finally {
      setLoading(false);
    }
  }, [servicioId, user, isCIT]);

  useEffect(() => {
    void cargarDetalle();
  }, [cargarDetalle]);

  // Solicitud activa del usuario para este servicio
  const solicitudActiva = useMemo(
    () =>
      misSolicitudes.find((sol) =>
        ESTADOS_ACTIVOS.has(sol.Estado?.codigo?.toUpperCase() ?? "PENDIENTE"),
      ) ?? null,
    [misSolicitudes],
  );

  // El usuario puede calificar si solicitó el servicio (estado no rechazado) y aún no calificó
  const tieneSolicitudValida = useMemo(
    () =>
      misSolicitudes.some(
        (sol) => sol.Estado?.codigo?.toUpperCase() !== "RECHAZADO",
      ),
    [misSolicitudes],
  );

  const yaCalifico = useMemo(() => {
    if (!user || !servicio?.Resenas) return false;
    return servicio.Resenas.some((r) => r.user_id === user.id);
  }, [user, servicio]);

  const handleSolicitar = async () => {
    if (!servicio) return;
    if (solicitudActiva) {
      setError("Ya tenés una solicitud en curso para este servicio.");
      return;
    }

    setError("");
    setFeedback("");
    setSolicitando(true);
    try {
      const nueva = await createSolicitud(servicio.id);
      setMisSolicitudes((prev) => [nueva, ...prev]);
      setFeedback(
        `Solicitud registrada exitosamente para "${servicio.servicio_nombre}".`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar la solicitud del servicio."));
    } finally {
      setSolicitando(false);
    }
  };

  const handleEnviarResena = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!servicio) return;

    setErrorResena("");
    setFeedbackResena("");

    const texto = comentario.trim();
    if (calificacion < 1 || calificacion > 5) {
      setErrorResena("Seleccioná una calificación entre 1 y 5 estrellas.");
      return;
    }
    if (texto.length < 10) {
      setErrorResena("La reseña debe tener al menos 10 caracteres.");
      return;
    }

    setEnviandoResena(true);
    try {
      const res = await createResenaServicio(servicio.id, {
        calificacion,
        comentario: texto,
      });
      setComentario("");
      setFeedbackResena(res.msg || "Tu calificación y reseña fueron publicadas.");
      await cargarDetalle();
    } catch (err) {
      setErrorResena(
        getApiError(err, "No se pudo registrar tu calificación."),
      );
    } finally {
      setEnviandoResena(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Card>
          <Skeleton lines={5} />
        </Card>
      </div>
    );
  }

  if (error && !servicio) {
    return (
      <div className="space-y-4">
        <Link
          to="/servicios"
          className="inline-block text-sm text-[#3fb950] hover:underline"
        >
          ← Volver a Servicios
        </Link>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!servicio) return null;

  const resenas = servicio.Resenas ?? [];
  const totalResenas = servicio.totalResenas ?? resenas.length;
  const promedio = servicio.promedioCalificacion ?? null;
  const proveedorNombre = servicio.Proveedor
    ? obtenerNombreVisible({
        nombre: servicio.Proveedor.Profile?.first_name,
        apellido: servicio.Proveedor.Profile?.last_name,
        username: servicio.Proveedor.username,
      })
    : "CIT Formosa";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/servicios"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#3fb950] hover:underline"
        >
          ← Volver al catálogo de Servicios
        </Link>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {feedback && (
        <Alert variant="success" onDismiss={() => setFeedback("")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{feedback}</span>
            <Link
              to="/solicitudes"
              className="font-semibold underline hover:text-white"
            >
              Ir a Solicitudes →
            </Link>
          </div>
        </Alert>
      )}

      {/* Tarjeta principal con detalle del servicio y contratación */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">
                  Área: {servicio.Sector?.nombre || "General"}
                </Badge>
                <Badge variant="neutral">Servicio ID #{servicio.id}</Badge>
              </div>
              {promedio !== null && totalResenas > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <EstrellasVisuales valor={promedio} />
                  <span className="font-semibold text-white">
                    {promedio.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#8b949e]">
                    ({totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"})
                  </span>
                </div>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {servicio.servicio_nombre}
            </h1>

            <p className="mt-1 text-xs text-[#8b949e]">
              Publicado el {formatearFecha(servicio.createdAt, "long")} · Responsable:{" "}
              <span className="text-slate-300">{proveedorNombre}</span>
            </p>

            {servicio.servicio_img && (
              <div className="mt-5 overflow-hidden rounded-lg border border-[#30363d]">
                <img
                  src={servicio.servicio_img}
                  alt={servicio.servicio_nombre}
                  className="max-h-80 w-full object-cover"
                />
              </div>
            )}

            <div className="mt-6 space-y-4 border-t border-[#30363d] pt-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#3fb950]">
                  Descripción y Características del Servicio
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                  {servicio.servicio_description}
                </p>
              </div>

              <div className="grid gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#8b949e]">Área / Sector Técnico</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {servicio.Sector?.nombre || "No especificado"} (
                    {servicio.Sector?.codigo || "—"})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8b949e]">Arancel de Referencia</p>
                  <p className="mt-0.5 text-sm font-bold text-[#3fb950]">
                    {formatearPrecio(servicio.servicio_precio)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8b949e]">Profesional / Proveedor CIT</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {proveedorNombre}
                    {servicio.Proveedor?.email
                      ? ` (${servicio.Proveedor.email})`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8b949e]">Calificación Promedio</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {promedio !== null && totalResenas > 0
                      ? `${promedio.toFixed(1)} / 5 (${totalResenas} ${
                          totalResenas === 1 ? "reseña" : "reseñas"
                        })`
                      : "Sin calificaciones suficientes"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna lateral: Condiciones y Contratación */}
        <div className="space-y-4">
          <Card
            header={
              <h2 className="text-sm font-semibold text-white">
                Contratación del Servicio
              </h2>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">
                  Arancel
                </p>
                <p className="mt-1 text-2xl font-bold text-[#3fb950]">
                  {formatearPrecio(servicio.servicio_precio)}
                </p>
              </div>

              <div className="space-y-2 border-t border-[#30363d] pt-3 text-xs text-slate-300">
                <p className="font-semibold text-white">
                  Condiciones de solicitud:
                </p>
                <ul className="list-disc space-y-1.5 pl-4">
                  <li>
                    La solicitud queda asociada a tu cuenta de usuario y ingresa en
                    estado <strong>Pendiente</strong>.
                  </li>
                  <li>
                    El equipo técnico del CIT evaluará la disponibilidad y actualizará
                    el estado en la sección <strong>Solicitudes</strong>.
                  </li>
                  {Number(servicio.servicio_precio) <= 0 && (
                    <li>
                      Este servicio requiere coordinación previa de arancel y
                      acondicionamiento de muestras (<strong>Consultar</strong>).
                    </li>
                  )}
                </ul>
              </div>

              {!user ? (
                <Link
                  to="/login"
                  className="block w-full rounded-md bg-[#238636] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#2ea043]"
                >
                  Iniciá sesión para solicitar
                </Link>
              ) : isCIT ? (
                <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-xs text-[#8b949e]">
                  Estás visualizando este servicio con rol de gestión CIT. Podés
                  administrar los pedidos recibidos desde{" "}
                  <Link to="/solicitudes" className="text-[#3fb950] underline">
                    Solicitudes
                  </Link>
                  .
                </div>
              ) : solicitudActiva ? (
                <div className="space-y-2 rounded-md border border-[#30363d] bg-[#0d1117] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">
                      Estado de tu solicitud:
                    </span>
                    <Badge
                      variant={badgeVariantPorEstado(
                        solicitudActiva.Estado?.codigo ?? "PENDIENTE",
                      )}
                    >
                      {solicitudActiva.Estado?.nombre ?? "Pendiente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#8b949e]">
                    Ya contás con una solicitud en curso para este servicio.
                  </p>
                  <Link
                    to="/solicitudes"
                    className="inline-block text-xs font-semibold text-[#3fb950] hover:underline"
                  >
                    Ver seguimiento en Solicitudes →
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full"
                  loading={solicitando}
                  onClick={() => void handleSolicitar()}
                >
                  {solicitando ? "Procesando solicitud…" : "Solicitar servicio"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sección de Calificaciones y Reseñas */}
      <section aria-labelledby="heading-resenas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
          <div>
            <h2 id="heading-resenas" className="text-lg font-semibold text-white">
              Calificaciones y Reseñas de Usuarios
            </h2>
            <p className="text-xs text-[#8b949e]">
              Experiencias verificadas de usuarios que solicitaron este servicio.
            </p>
          </div>
          {promedio !== null && totalResenas > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5">
              <EstrellasVisuales valor={promedio} />
              <span className="text-sm font-bold text-white">
                {promedio.toFixed(1)} / 5
              </span>
              <span className="text-xs text-[#8b949e]">
                ({totalResenas} {totalResenas === 1 ? "opinión" : "opiniones"})
              </span>
            </div>
          )}
        </div>

        {/* Formulario de calificación (solo usuarios habilitados que hayan solicitado el servicio y no hayan calificado antes) */}
        {user && !isCIT && (
          <Card
            header={
              <h3 className="text-sm font-semibold text-white">
                Calificar este servicio
              </h3>
            }
          >
            {errorResena && (
              <Alert
                variant="error"
                className="mb-4"
                onDismiss={() => setErrorResena("")}
              >
                {errorResena}
              </Alert>
            )}
            {feedbackResena && (
              <Alert
                variant="success"
                className="mb-4"
                onDismiss={() => setFeedbackResena("")}
              >
                {feedbackResena}
              </Alert>
            )}

            {yaCalifico ? (
              <p className="text-sm text-[#3fb950]">
                ✓ Ya registraste tu calificación y reseña para este servicio. ¡Gracias
                por compartir tu experiencia!
              </p>
            ) : !tieneSolicitudValida ? (
              <p className="text-sm text-[#8b949e]">
                Para mantener la autenticidad de las opiniones, solo los usuarios que
                hayan solicitado este servicio pueden registrar una calificación y
                reseña.
              </p>
            ) : (
              <form onSubmit={handleEnviarResena} className="space-y-4">
                <div>
                  <label
                    htmlFor="select-calificacion"
                    className="mb-1.5 block text-xs font-medium text-[#8b949e]"
                  >
                    Tu calificación *
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      id="select-calificacion"
                      aria-label="Seleccionar calificación"
                      value={calificacion}
                      onChange={(e) => setCalificacion(Number(e.target.value))}
                      className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-sm text-white outline-none focus:border-[#3fb950]"
                    >
                      <option value={5}>5 estrellas — Excelente</option>
                      <option value={4}>4 estrellas — Muy bueno</option>
                      <option value={3}>3 estrellas — Bueno</option>
                      <option value={2}>2 estrellas — Regular</option>
                      <option value={1}>1 estrella — Insatisfactorio</option>
                    </select>
                    <EstrellasVisuales valor={calificacion} />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="comentario-resena"
                    className="mb-1.5 block text-xs font-medium text-[#8b949e]"
                  >
                    Tu reseña (mínimo 10 caracteres) *
                  </label>
                  <textarea
                    id="comentario-resena"
                    rows={3}
                    required
                    minLength={10}
                    maxLength={1000}
                    placeholder="Compartí tu experiencia con la atención, tiempos de respuesta y resultados del servicio…"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="input-base"
                  />
                </div>

                <Button type="submit" loading={enviandoResena}>
                  {enviandoResena ? "Publicando…" : "Publicar reseña"}
                </Button>
              </form>
            )}
          </Card>
        )}

        {/* Listado de reseñas existentes */}
        {resenas.length === 0 ? (
          <EmptyState
            title="Aún no hay reseñas para este servicio"
            description="Sé el primero en compartir tu experiencia luego de solicitar este servicio."
          />
        ) : (
          <div className="grid gap-3">
            {resenas.map((resena) => {
              const autorNombre = resena.Autor
                ? obtenerNombreVisible({
                    nombre: resena.Autor.Profile?.first_name,
                    apellido: resena.Autor.Profile?.last_name,
                    username: resena.Autor.username,
                  })
                : `Usuario #${resena.user_id}`;

              return (
                <Card key={resena.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {autorNombre}
                      </span>
                      {resena.Autor?.username && (
                        <span className="text-xs text-[#8b949e]">
                          @{resena.Autor.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <EstrellasVisuales valor={resena.calificacion} />
                      <span className="text-xs text-[#8b949e]">
                        {formatearFecha(resena.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-200">
                    {resena.comentario}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
