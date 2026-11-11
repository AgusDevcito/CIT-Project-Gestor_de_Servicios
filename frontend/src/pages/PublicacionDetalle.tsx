import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import {
  obtenerMetaCategoriaPublicacion,
  type ArchivoPublicacion,
  type Publicacion,
  type TipoArchivo,
} from "../domain/publicaciones";
import { esPersonalCIT } from "../domain/roles";
import { formatearFecha, obtenerNombreVisible } from "../lib/formatters";
import {
  addArchivo,
  deleteArchivo,
  getPublicacionById,
  toggleEstadoPublicacion,
} from "../services/publicacionesService";
import { enrollInCapacitacion } from "../services/profileService";

export default function PublicacionDetalle() {
  const { id } = useParams();
  const publicacionId = Number(id);
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Gestión de archivos adjuntos (exclusivo CIT/Admin)
  const [tipoArchivo, setTipoArchivo] = useState<TipoArchivo>("imagen");
  const [archivoUrl, setArchivoUrl] = useState("");
  const [archivoNombre, setArchivoNombre] = useState("");
  const [archivoOrden, setArchivoOrden] = useState<number>(0);
  const [submittingArchivo, setSubmittingArchivo] = useState(false);
  const [deletingArchivoId, setDeletingArchivoId] = useState<number | null>(null);
  const [togglingEstado, setTogglingEstado] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  // Lightbox para ampliar imagen
  const [imagenAmpliada, setImagenAmpliada] =
    useState<ArchivoPublicacion | null>(null);

  const cargarPublicacion = useCallback(async () => {
    if (!Number.isFinite(publicacionId) || publicacionId <= 0) {
      setError("La publicación solicitada no es válida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getPublicacionById(publicacionId);
      setPublicacion(data);
      setArchivoOrden((data.Archivo?.length ?? 0) + 1);
    } catch (err) {
      setError(getApiError(err, "No se pudo cargar la publicación."));
    } finally {
      setLoading(false);
    }
  }, [publicacionId]);

  useEffect(() => {
    void cargarPublicacion();
  }, [cargarPublicacion]);

  const handleToggleEstado = async () => {
    if (!publicacion) return;
    setError("");
    setFeedback("");
    setTogglingEstado(true);
    try {
      const actualizada = await toggleEstadoPublicacion(
        publicacion.id,
        !publicacion.publicado,
      );
      setPublicacion(actualizada);
      setFeedback(
        actualizada.publicado
          ? "La publicación fue publicada y ya es visible para todos los usuarios."
          : "La publicación fue despublicada y quedó como borrador interno.",
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo cambiar el estado de la publicación."),
      );
    } finally {
      setTogglingEstado(false);
    }
  };

  const handleAgregarArchivo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!publicacion) return;
    setError("");
    setFeedback("");

    if (!archivoUrl.trim()) {
      setError("La URL del archivo o recurso visual es obligatoria.");
      return;
    }

    setSubmittingArchivo(true);
    try {
      const nuevo = await addArchivo(publicacion.id, {
        tipo: tipoArchivo,
        archivo_url: archivoUrl.trim(),
        archivo_nombre: archivoNombre.trim() || publicacion.titulo,
        orden: Number.isFinite(archivoOrden) ? archivoOrden : 0,
      });

      const nuevosArchivos = [...(publicacion.Archivo ?? []), nuevo].sort(
        (a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id,
      );
      setPublicacion({
        ...publicacion,
        Archivo: nuevosArchivos,
      });
      setArchivoUrl("");
      setArchivoNombre("");
      setArchivoOrden(nuevosArchivos.length + 1);
      setFeedback("Recurso adjunto incorporado correctamente.");
    } catch (err) {
      setError(getApiError(err, "No se pudo adjuntar el archivo."));
    } finally {
      setSubmittingArchivo(false);
    }
  };

  const handleEliminarArchivo = async (archivo: ArchivoPublicacion) => {
    if (!publicacion) return;
    setError("");
    setFeedback("");
    setDeletingArchivoId(archivo.id);
    try {
      await deleteArchivo(archivo.id);
      setPublicacion({
        ...publicacion,
        Archivo: (publicacion.Archivo ?? []).filter(
          (item) => item.id !== archivo.id,
        ),
      });
      setFeedback("El recurso adjunto fue eliminado.");
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar el archivo adjunto."));
    } finally {
      setDeletingArchivoId(null);
    }
  };

  const handleInscribirse = async () => {
    if (!publicacion) return;
    setError("");
    setFeedback("");
    setEnrolling(true);
    try {
      const res = await enrollInCapacitacion(publicacion.id);
      setEnrolled(true);
      setFeedback(
        res.msg ||
          "Tu inscripción fue registrada correctamente. Podés consultarla en Mi Perfil → Mis Capacitaciones.",
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo registrar la inscripción a la capacitación."),
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4" aria-busy="true">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !publicacion) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          to="/publicaciones"
          className="text-sm font-medium text-[#58a6ff] hover:underline"
        >
          ← Volver a Publicaciones
        </Link>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!publicacion) return null;

  const metaCat = obtenerMetaCategoriaPublicacion(publicacion.tipo_contenido);
  const archivos = publicacion.Archivo ?? [];
  const estaPublicada = publicacion.publicado !== false;
  const autorVisible = publicacion.Autor
    ? obtenerNombreVisible({
        nombre: publicacion.Autor.Profile?.first_name,
        apellido: publicacion.Autor.Profile?.last_name,
        username: publicacion.Autor.username,
      })
    : null;

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/publicaciones"
          className="text-sm font-medium text-[#58a6ff] hover:underline"
        >
          ← Volver a Publicaciones
        </Link>

        {isCIT && (
          <div className="flex items-center gap-2">
            <Badge variant={estaPublicada ? "success" : "warning"}>
              {estaPublicada ? "Publicada" : "Borrador / No publicada"}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={togglingEstado}
              onClick={() => void handleToggleEstado()}
            >
              {estaPublicada ? "Despublicar" : "Publicar ahora"}
            </Button>
          </div>
        )}
      </div>

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

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={metaCat.badgeVariant}>{metaCat.etiqueta}</Badge>
          <Badge variant="neutral">
            {publicacion.Sector?.nombre || "Sin sector"}
          </Badge>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e6edf3] sm:text-3xl">
            {publicacion.titulo}
          </h1>
          <p className="mt-2 text-sm text-[#8b949e]">
            Publicado el {formatearFecha(publicacion.createdAt, "long")}
            {autorVisible ? ` · Por ${autorVisible}` : ""}
          </p>
        </div>

        <div className="border-t border-[#21262d] pt-5">
          <p className="whitespace-pre-line text-base leading-relaxed text-[#e6edf3]">
            {publicacion.contenido}
          </p>
        </div>

        {user &&
          ["capacitacion", "inscripcion", "jornada"].includes(
            publicacion.tipo_contenido,
          ) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#238636]/40 bg-[#0d2e0f]/30 p-4">
              <div>
                <p className="text-sm font-semibold text-[#e6edf3]">
                  Inscripción a actividad formativa del CIT
                </p>
                <p className="text-xs text-[#8b949e]">
                  Registrá tu participación para hacer seguimiento desde la sección Mis Capacitaciones de tu perfil.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={enrolled ? "secondary" : "primary"}
                disabled={enrolled}
                loading={enrolling}
                onClick={() => void handleInscribirse()}
              >
                {enrolled ? "Inscripción registrada" : "Inscribirme a esta capacitación"}
              </Button>
            </div>
          )}
      </Card>

      {/* Galería de Recursos Visuales y Archivos Adjuntos */}
      {(archivos.length > 0 || isCIT) && (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-3">
            <div>
              <h2 className="text-lg font-semibold text-[#e6edf3]">
                Recursos visuales y archivos adjuntos
              </h2>
              <p className="text-xs text-[#8b949e]">
                Imágenes, afiches de jornadas y material audiovisual complementario.
              </p>
            </div>
            <Badge variant="neutral">{archivos.length} adjuntos</Badge>
          </div>

          {archivos.length === 0 ? (
            <p className="text-sm text-[#8b949e]">
              Esta publicación aún no tiene recursos visuales adjuntos.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117]"
                >
                  {archivo.tipo === "imagen" ? (
                    <div className="h-52 w-full overflow-hidden bg-[#161b22]">
                      <img
                        src={archivo.archivo_url}
                        alt={
                          archivo.archivo_nombre ||
                          "Imagen adjunta de la publicación"
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-52 flex-col items-center justify-center bg-[#161b22] p-4 text-center">
                      <span className="text-3xl" aria-hidden="true">
                        🎬
                      </span>
                      <p className="mt-2 text-sm font-medium text-[#e6edf3]">
                        {archivo.archivo_nombre || "Recurso de video"}
                      </p>
                      <p className="mt-1 text-xs text-[#8b949e]">
                        Material audiovisual complementario
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#e6edf3]">
                        {archivo.archivo_nombre || "Recurso sin título"}
                      </p>
                      <p className="text-xs uppercase text-[#8b949e]">
                        {archivo.tipo}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {archivo.tipo === "imagen" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setImagenAmpliada(archivo)}
                        >
                          Ampliar
                        </Button>
                      ) : (
                        <a
                          href={archivo.archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#58a6ff] hover:bg-[#30363d]"
                        >
                          Abrir video
                        </a>
                      )}

                      {isCIT && (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          loading={deletingArchivoId === archivo.id}
                          onClick={() => void handleEliminarArchivo(archivo)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCIT && (
            <form
              onSubmit={handleAgregarArchivo}
              className="mt-4 space-y-4 rounded-xl border border-[#30363d] bg-[#0d1117] p-4"
            >
              <h3 className="text-sm font-semibold text-[#e6edf3]">
                Agregar archivo o recurso visual
              </h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label
                    htmlFor="adj-tipo"
                    className="mb-1 block text-xs text-[#8b949e]"
                  >
                    Tipo
                  </label>
                  <select
                    id="adj-tipo"
                    value={tipoArchivo}
                    onChange={(e) =>
                      setTipoArchivo(e.target.value as TipoArchivo)
                    }
                    className="input-base"
                  >
                    <option value="imagen">Imagen</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="adj-url"
                    className="mb-1 block text-xs text-[#8b949e]"
                  >
                    URL del recurso *
                  </label>
                  <input
                    id="adj-url"
                    type="url"
                    required
                    placeholder="https://ejemplo.gob.ar/imagen.jpg"
                    value={archivoUrl}
                    onChange={(e) => setArchivoUrl(e.target.value)}
                    className="input-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adj-nombre"
                    className="mb-1 block text-xs text-[#8b949e]"
                  >
                    Nombre / Epígrafe
                  </label>
                  <input
                    id="adj-nombre"
                    placeholder="Flyer jornada"
                    value={archivoNombre}
                    onChange={(e) => setArchivoNombre(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={submittingArchivo}>
                  Adjuntar recurso
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      <Modal
        open={Boolean(imagenAmpliada)}
        onClose={() => setImagenAmpliada(null)}
        title={imagenAmpliada?.archivo_nombre || publicacion.titulo}
      >
        {imagenAmpliada && (
          <div className="space-y-3">
            <img
              src={imagenAmpliada.archivo_url}
              alt={imagenAmpliada.archivo_nombre || publicacion.titulo}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
            <div className="flex justify-end">
              <a
                href={imagenAmpliada.archivo_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-[#58a6ff] hover:underline"
              >
                Abrir imagen original en pestaña nueva ↗
              </a>
            </div>
          </div>
        )}
      </Modal>
    </article>
  );
}
