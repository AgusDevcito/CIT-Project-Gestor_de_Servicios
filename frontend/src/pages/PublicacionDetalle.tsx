import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getApiError } from "../domain/errors";
import { getPublicacionById } from "../services/publicacionesService";
import type { Publicacion } from "../domain/entidades";

const fechaFormato = (fecha: string): string =>
  new Date(fecha).toLocaleDateString("es-AR", { dateStyle: "long" });

export default function PublicacionDetalle() {
  const { id } = useParams();
  const publicacionId = Number(id);

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(publicacionId)) {
      setError("La publicación solicitada no es válida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicacionById(publicacionId)
      .then(setPublicacion)
      .catch((err) => setError(getApiError(err, "No se pudo cargar la publicación.")))
      .finally(() => setLoading(false));
  }, [publicacionId]);

  if (loading) {
    return <p className="animate-pulse text-cit-neon">Cargando publicación…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!publicacion) return null;

  const archivos = publicacion.Archivo ?? [];

  return (
    <article className="max-w-3xl">
      <Link to="/publicaciones" className="text-sm text-cit-neon hover:underline">
        ← Volver a Publicaciones
      </Link>

      <div className="mt-4 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cit-700 px-2.5 py-0.5 text-xs text-cit-neon">
            {publicacion.tipo_contenido}
          </span>
          <span className="rounded-full border border-cit-600/40 px-2.5 py-0.5 text-xs text-slate-300">
            {publicacion.Sector?.nombre || "Sin sector"}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-bold text-white">{publicacion.titulo}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Publicado el {fechaFormato(publicacion.createdAt)}
          {publicacion.Autor?.username ? ` por ${publicacion.Autor.username}` : ""}
        </p>

        <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-200">
          {publicacion.contenido}
        </p>
      </div>

      {archivos.length > 0 && (
        <div className="mt-6 rounded-2xl border border-cit-600/40 bg-cit-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-cit-neon">Archivos adjuntos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {archivos.map((archivo) =>
              archivo.tipo === "imagen" ? (
                <img
                  key={archivo.id}
                  src={archivo.archivo_url}
                  alt={archivo.archivo_nombre || "Imagen de la publicación"}
                  className="rounded-xl border border-cit-600/40"
                />
              ) : (
                <div
                  key={archivo.id}
                  className="rounded-xl border border-cit-600/40 bg-cit-900 p-4 text-sm"
                >
                  <p className="text-slate-300">🎥 {archivo.archivo_nombre || "Video"}</p>
                  <a
                    href={archivo.archivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-cit-neon hover:underline"
                  >
                    Abrir video
                  </a>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </article>
  );
}
