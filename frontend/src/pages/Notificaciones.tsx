import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
   type BadgeVariant,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type { NotificacionItem, TipoNotificacion } from "../domain/entidades";
import { esPersonalCIT } from "../domain/roles";
import { formatearFecha } from "../lib/formatters";
import {
  emitirAnuncioPlataforma,
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "../services/notificacionesService";

const META_TIPO_NOTIFICACION: Record<
  TipoNotificacion,
  { etiqueta: string; variant: BadgeVariant }
> = {
  NUEVA_PUBLICACION: {
    etiqueta: "Noticias y Publicaciones",
    variant: "info",
  },
  CAMBIO_ESTADO_PROPUESTA: {
    etiqueta: "Estado de Propuesta",
    variant: "warning",
  },
  NUEVO_SERVICIO: {
    etiqueta: "Nuevo Servicio",
    variant: "success",
  },
  ACTUALIZACION_PLATAFORMA: {
    etiqueta: "Update de Plataforma",
    variant: "purple",
  },
  ACTIVIDAD_USUARIO: {
    etiqueta: "Solicitudes y Capacitaciones",
    variant: "neutral",
  },
};

export default function Notificaciones() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filtros
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("");

  // Estados de acción
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Modal CIT/Admin para emitir anuncio de plataforma
  const [modalAnuncio, setModalAnuncio] = useState(false);
  const [anuncioTitulo, setAnuncioTitulo] = useState("");
  const [anuncioMensaje, setAnuncioMensaje] = useState("");
  const [anuncioEnlace, setAnuncioEnlace] = useState("");
  const [enviandoAnuncio, setEnviandoAnuncio] = useState(false);

  const cargarNotificaciones = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getNotificaciones({ limit: 50 });
      setNotificaciones(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError(
        getApiError(err, "No se pudieron cargar tus notificaciones."),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarNotificaciones();
  }, [cargarNotificaciones]);

  const notificacionesFiltradas = useMemo(() => {
    return notificaciones.filter((item) => {
      if (soloNoLeidas && item.leida) return false;
      if (tipoFiltro && item.tipo !== tipoFiltro) return false;
      return true;
    });
  }, [notificaciones, soloNoLeidas, tipoFiltro]);

  const handleMarcarLeida = async (item: NotificacionItem) => {
    if (item.leida) return;
    setMarkingId(item.id);
    setError("");
    try {
      const actualizada = await marcarNotificacionLeida(item.id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === item.id ? actualizada : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(
        getApiError(err, "No se pudo marcar la notificación como leída."),
      );
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    setMarkingAll(true);
    setError("");
    setFeedback("");
    try {
      const res = await marcarTodasNotificacionesLeidas();
      setNotificaciones((prev) =>
        prev.map((n) => ({
          ...n,
          leida: true,
          fecha_lectura: n.fecha_lectura || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      setFeedback(
        res.msg || "Todas tus notificaciones fueron marcadas como leídas.",
      );
    } catch (err) {
      setError(
        getApiError(
          err,
          "No se pudieron marcar las notificaciones como leídas.",
        ),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleEmitirAnuncio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!anuncioTitulo.trim() || !anuncioMensaje.trim()) {
      setError("El título y el mensaje del anuncio son obligatorios.");
      return;
    }

    setEnviandoAnuncio(true);
    setError("");
    setFeedback("");
    try {
      const res = await emitirAnuncioPlataforma({
        titulo: anuncioTitulo.trim(),
        mensaje: anuncioMensaje.trim(),
        enlace: anuncioEnlace.trim() || undefined,
      });
      setModalAnuncio(false);
      setAnuncioTitulo("");
      setAnuncioMensaje("");
      setAnuncioEnlace("");
      setFeedback(
        res.msg || "Anuncio de actualización de plataforma enviado.",
      );
      await cargarNotificaciones();
    } catch (err) {
      setError(getApiError(err, "No se pudo emitir el anuncio institucional."));
    } finally {
      setEnviandoAnuncio(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro de Notificaciones"
        subtitle="Avisos sobre noticias y publicaciones técnicas, estado de tus propuestas, nuevos servicios del catálogo, resultados digitales y novedades de CITio."
        count={!loading ? unreadCount : undefined}
        countLabel="No leídas"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={markingAll}
                onClick={() => void handleMarcarTodasLeidas()}
              >
                Marcar todas como leídas
              </Button>
            )}
            <LinkButton to="/ajustes/notificaciones" variant="secondary" size="sm">
              Configurar avisos y WhatsApp
            </LinkButton>
            {isCIT && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setModalAnuncio(true)}
              >
                + Emitir anuncio de plataforma
              </Button>
            )}
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

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gh-elevated pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoloNoLeidas(false)}
            aria-pressed={!soloNoLeidas}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              !soloNoLeidas
                ? "bg-cit-accent text-white"
                : "border border-gh-border bg-gh-surface text-gh-muted hover:text-white"
            }`}
          >
            Todas ({notificaciones.length})
          </button>
          <button
            type="button"
            onClick={() => setSoloNoLeidas(true)}
            aria-pressed={soloNoLeidas}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              soloNoLeidas
                ? "bg-cit-accent text-white"
                : "border border-gh-border bg-gh-surface text-gh-muted hover:text-white"
            }`}
          >
            No leídas ({unreadCount})
          </button>
        </div>

        <select
          aria-label="Filtrar notificaciones por categoría"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="input-base sm:w-64"
        >
          <option value="">Todas las categorías</option>
          <option value="NUEVA_PUBLICACION">Noticias y publicaciones</option>
          <option value="CAMBIO_ESTADO_PROPUESTA">Estado de propuestas</option>
          <option value="NUEVO_SERVICIO">Nuevos servicios</option>
          <option value="ACTIVIDAD_USUARIO">
            Solicitudes y capacitaciones
          </option>
          <option value="ACTUALIZACION_PLATAFORMA">
            Updates de la plataforma
          </option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : notificacionesFiltradas.length === 0 ? (
        <EmptyState
          title={
            soloNoLeidas
              ? "No tenés notificaciones pendientes de lectura"
              : "Aún no tenés notificaciones registradas"
          }
          description="Te avisaremos aquí (y por WhatsApp o correo según tus preferencias) cuando haya novedades en tus propuestas, servicios o publicaciones del CIT."
          action={
            <LinkButton to="/ajustes/notificaciones">
              Revisar preferencias de avisos
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {notificacionesFiltradas.map((item) => {
            const meta = META_TIPO_NOTIFICACION[item.tipo] ?? {
              etiqueta: item.tipo,
              variant: "neutral" as BadgeVariant,
            };

            return (
              <Card
                key={item.id}
                className={`space-y-2.5 transition-colors ${
                  item.leida
                    ? "border-gh-elevated opacity-85"
                    : "border-cit-accent/60 bg-cit-forest/20"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.leida && (
                      <span
                        role="img"
                        aria-label="No leída"
                        className="h-2.5 w-2.5 rounded-full bg-cit-accent-emphasis"
                      />
                    )}
                    <Badge variant={meta.variant}>{meta.etiqueta}</Badge>
                    <span className="text-xs text-gh-muted">
                      {formatearFecha(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.enlace && (
                      <Link
                        to={item.enlace}
                        onClick={() => {
                          if (!item.leida) void handleMarcarLeida(item);
                        }}
                        className="text-xs font-semibold text-status-info hover:underline"
                      >
                        Ver detalle →
                      </Link>
                    )}
                    {!item.leida && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={markingId === item.id}
                        onClick={() => void handleMarcarLeida(item)}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-semibold text-gh-text">
                  {item.titulo}
                </h2>
                <p className="text-sm leading-relaxed text-gh-muted">
                  {item.mensaje}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal CIT/Admin para emitir anuncio de actualización de la plataforma */}
      <Modal
        open={modalAnuncio}
        onClose={() => setModalAnuncio(false)}
        title="Emitir anuncio de actualización de plataforma"
      >
        <form onSubmit={handleEmitirAnuncio} className="space-y-4">
          <div>
            <label
              htmlFor="anuncio-titulo"
              className="mb-1.5 block text-xs font-medium text-gh-text"
            >
              Título del anuncio o update *
            </label>
            <input
              id="anuncio-titulo"
              required
              maxLength={200}
              placeholder="Ej.: Nuevo laboratorio de diagnóstico molecular habilitado"
              value={anuncioTitulo}
              onChange={(e) => setAnuncioTitulo(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="anuncio-mensaje"
              className="mb-1.5 block text-xs font-medium text-gh-text"
            >
              Mensaje para productores y usuarios *
            </label>
            <textarea
              id="anuncio-mensaje"
              rows={3}
              required
              placeholder="Describí la novedad, actualización o comunicado institucional…"
              value={anuncioMensaje}
              onChange={(e) => setAnuncioMensaje(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="anuncio-enlace"
              className="mb-1.5 block text-xs font-medium text-gh-text"
            >
              Enlace interno opcional
            </label>
            <input
              id="anuncio-enlace"
              placeholder="Ej.: /servicios o /capacitaciones"
              value={anuncioEnlace}
              onChange={(e) => setAnuncioEnlace(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAnuncio(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={enviandoAnuncio}>
              Enviar notificación a usuarios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
