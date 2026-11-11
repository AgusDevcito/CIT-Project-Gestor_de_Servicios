import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SearchFilterBar,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import {
  CATEGORIAS_PUBLICACION,
  obtenerMetaCategoriaPublicacion,
  type Publicacion,
  type TipoArchivo,
  type TipoContenido,
} from "../domain/publicaciones";
import { esPersonalCIT } from "../domain/roles";
import type { Sector } from "../domain/catalogos";
import { formatearFecha, obtenerNombreVisible } from "../lib/formatters";
import {
  getSectores,
  SECTORES_OFICIALES_CIT,
} from "../services/catalogosService";
import {
  createPublicacion,
  deletePublicacion,
  getPublicaciones,
  toggleEstadoPublicacion,
  updatePublicacion,
} from "../services/publicacionesService";

interface FormularioPublicacion {
  titulo: string;
  contenido: string;
  tipo_contenido: TipoContenido;
  sector: string;
  publicado: boolean;
  imagen_url: string;
  archivo_nombre: string;
  archivo_tipo: TipoArchivo;
}

const INITIAL_FORM: FormularioPublicacion = {
  titulo: "",
  contenido: "",
  tipo_contenido: "noticia",
  sector: "",
  publicado: true,
  imagen_url: "",
  archivo_nombre: "",
  archivo_tipo: "imagen",
};

const FILTROS_RAPIDOS: ReadonlyArray<{ codigo: string; etiqueta: string }> = [
  { codigo: "TODAS", etiqueta: "Todas" },
  { codigo: "noticia", etiqueta: "Noticias" },
  { codigo: "jornada", etiqueta: "Jornadas" },
  { codigo: "inscripcion", etiqueta: "Inscripciones" },
  { codigo: "capacitacion", etiqueta: "Capacitaciones" },
];

export default function Publicaciones() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filtros de listado
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [filtroSector, setFiltroSector] = useState<string>("TODOS");
  const [filtroVisibilidad, setFiltroVisibilidad] = useState<
    "TODAS" | "PUBLICADAS" | "BORRADORES"
  >("TODAS");

  // Estado del formulario ABM (exclusivo CIT/Admin)
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Publicacion | null>(null);
  const [form, setForm] = useState<FormularioPublicacion>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const sectoresPromise = getSectores().catch(() => SECTORES_OFICIALES_CIT);
    try {
      const [data, sectoresData] = await Promise.all([
        getPublicaciones(),
        sectoresPromise,
      ]);
      setPublicaciones(data);
      setSectores(
        sectoresData.length > 0 ? sectoresData : SECTORES_OFICIALES_CIT,
      );
    } catch (err) {
      const sectoresFallback = await sectoresPromise;
      setSectores(
        sectoresFallback.length > 0 ? sectoresFallback : SECTORES_OFICIALES_CIT,
      );
      setError(getApiError(err, "No se pudieron cargar las publicaciones."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const publicacionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return publicaciones.filter((pub) => {
      const estaPublicada = pub.publicado !== false;
      if (!isCIT && !estaPublicada) {
        return false;
      }

      if (filtroCategoria !== "TODAS" && pub.tipo_contenido !== filtroCategoria) {
        return false;
      }

      if (
        filtroSector !== "TODOS" &&
        pub.Sector?.codigo !== filtroSector &&
        String(pub.sector_id) !== filtroSector
      ) {
        return false;
      }

      if (isCIT) {
        if (filtroVisibilidad === "PUBLICADAS" && !estaPublicada) return false;
        if (filtroVisibilidad === "BORRADORES" && estaPublicada) return false;
      }

      if (!q) return true;

      const autorNombre = obtenerNombreVisible({
        nombre: pub.Autor?.Profile?.first_name,
        apellido: pub.Autor?.Profile?.last_name,
        username: pub.Autor?.username,
      }).toLowerCase();
      const metaCat = obtenerMetaCategoriaPublicacion(pub.tipo_contenido);

      return (
        pub.titulo.toLowerCase().includes(q) ||
        pub.contenido.toLowerCase().includes(q) ||
        metaCat.etiqueta.toLowerCase().includes(q) ||
        (pub.Sector?.nombre ?? "").toLowerCase().includes(q) ||
        autorNombre.includes(q)
      );
    });
  }, [
    publicaciones,
    isCIT,
    filtroCategoria,
    filtroSector,
    filtroVisibilidad,
    busqueda,
  ]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...INITIAL_FORM,
      sector: sectores[0]?.codigo ?? "",
    });
    setShowForm(true);
    setFeedback("");
    setError("");
  };

  const openEdit = (publicacion: Publicacion) => {
    const primerRecurso = publicacion.Archivo?.[0];
    setEditing(publicacion);
    setForm({
      titulo: publicacion.titulo,
      contenido: publicacion.contenido,
      tipo_contenido: publicacion.tipo_contenido,
      sector: publicacion.Sector?.codigo ?? String(publicacion.sector_id),
      publicado: publicacion.publicado !== false,
      imagen_url: primerRecurso?.archivo_url ?? "",
      archivo_nombre: primerRecurso?.archivo_nombre ?? "",
      archivo_tipo: primerRecurso?.tipo ?? "imagen",
    });
    setShowForm(true);
    setFeedback("");
    setError("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }) as FormularioPublicacion);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    if (!form.titulo.trim() || !form.contenido.trim() || !form.sector) {
      setError("El título, la categoría, el área y el contenido son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        tipo_contenido: form.tipo_contenido,
        sector: form.sector,
        publicado: form.publicado,
        imagen_url: form.imagen_url.trim() || undefined,
        archivo_nombre: form.archivo_nombre.trim() || undefined,
        archivo_tipo: form.archivo_tipo,
      };

      if (editing) {
        await updatePublicacion(editing.id, payload);
        setFeedback(`La publicación "${payload.titulo}" fue actualizada correctamente.`);
      } else {
        await createPublicacion(payload);
        setFeedback(`La publicación "${payload.titulo}" fue creada correctamente.`);
      }

      setShowForm(false);
      setEditing(null);
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err) {
      setError(getApiError(err, "No se pudo guardar la publicación."));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublicado = async (publicacion: Publicacion) => {
    setError("");
    setFeedback("");
    setTogglingId(publicacion.id);
    try {
      const actualizada = await toggleEstadoPublicacion(
        publicacion.id,
        !publicacion.publicado,
      );
      setPublicaciones((prev) =>
        prev.map((item) => (item.id === actualizada.id ? actualizada : item)),
      );
      setFeedback(
        actualizada.publicado
          ? `La publicación "${actualizada.titulo}" ahora está publicada.`
          : `La publicación "${actualizada.titulo}" pasó a estado borrador/oculta.`,
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo actualizar el estado de la publicación."),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (publicacion: Publicacion) => {
    setError("");
    setFeedback("");
    setDeletingId(publicacion.id);
    try {
      await deletePublicacion(publicacion.id);
      setPublicaciones((prev) =>
        prev.filter((item) => item.id !== publicacion.id),
      );
      setFeedback(`La publicación "${publicacion.titulo}" fue eliminada.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la publicación."));
    } finally {
      setDeletingId(null);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCategoria("TODAS");
    setFiltroSector("TODOS");
    setFiltroVisibilidad("TODAS");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicaciones Institucionales y Científicas"
        subtitle="Noticias del centro, anuncios de jornadas, avisos de inscripción a capacitaciones y boletines técnicos del CIT."
        actions={
          isCIT ? (
            <Button
              variant={showForm ? "secondary" : "primary"}
              onClick={showForm ? () => setShowForm(false) : openCreate}
            >
              {showForm ? "Cancelar" : "+ Nueva publicación"}
            </Button>
          ) : undefined
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

      {/* Pestañas rápidas de categoría institucional */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Categorías principales de publicaciones"
      >
        {FILTROS_RAPIDOS.map((item) => {
          const activo = filtroCategoria === item.codigo;
          return (
            <button
              key={item.codigo}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setFiltroCategoria(item.codigo)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activo
                  ? "border-[#2ea043] bg-[#238636]/20 text-[#3fb950]"
                  : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:border-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              {item.etiqueta}
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda y filtros combinados */}
      <SearchFilterBar
        searchValue={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por título, contenido, categoría o autor…"
      >
        <select
          aria-label="Filtrar por categoría"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="input-base sm:w-52"
        >
          <option value="TODAS">Todas las categorías</option>
          <optgroup label="Institucionales y Capacitaciones">
            {CATEGORIAS_PUBLICACION.filter(
              (cat) => cat.grupo === "institucional",
            ).map((cat) => (
              <option key={cat.codigo} value={cat.codigo}>
                {cat.etiqueta}
              </option>
            ))}
          </optgroup>
          <optgroup label="Boletines Técnicos">
            {CATEGORIAS_PUBLICACION.filter((cat) => cat.grupo === "tecnico").map(
              (cat) => (
                <option key={cat.codigo} value={cat.codigo}>
                  {cat.etiqueta}
                </option>
              ),
            )}
          </optgroup>
        </select>

        <select
          aria-label="Filtrar por área"
          value={filtroSector}
          onChange={(e) => setFiltroSector(e.target.value)}
          className="input-base sm:w-48"
        >
          <option value="TODOS">Todas las áreas</option>
          {sectores.map((sec) => (
            <option key={sec.id} value={sec.codigo}>
              {sec.nombre}
            </option>
          ))}
        </select>

        {isCIT && (
          <select
            aria-label="Filtrar por estado de publicación"
            value={filtroVisibilidad}
            onChange={(e) =>
              setFiltroVisibilidad(
                e.target.value as "TODAS" | "PUBLICADAS" | "BORRADORES",
              )
            }
            className="input-base sm:w-44"
          >
            <option value="TODAS">Todos los estados</option>
            <option value="PUBLICADAS">Publicadas</option>
            <option value="BORRADORES">No publicadas / Borrador</option>
          </select>
        )}
      </SearchFilterBar>

      {/* Formulario de Creación / Edición para CIT y Admin */}
      {isCIT && showForm && (
        <Card className="border-[#2ea043]/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
              <div>
                <h2 className="text-lg font-semibold text-[#e6edf3]">
                  {editing ? "Editar publicación" : "Nueva publicación institucional"}
                </h2>
                <p className="text-xs text-[#8b949e]">
                  Compartí noticias, anuncios de jornadas, avisos de inscripción o capacitaciones.
                </p>
              </div>
              <Badge variant={form.publicado ? "success" : "warning"}>
                {form.publicado ? "Se publicará de inmediato" : "Borrador oculto al público"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="pub-titulo"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  Título de la publicación *
                </label>
                <input
                  id="pub-titulo"
                  name="titulo"
                  required
                  maxLength={160}
                  placeholder="Ej.: Inscripciones abiertas al Taller de Biotecnología Reproductiva"
                  value={form.titulo}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="pub-categoria"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  Categoría o tipo *
                </label>
                <select
                  id="pub-categoria"
                  name="tipo_contenido"
                  value={form.tipo_contenido}
                  onChange={handleChange}
                  className="input-base"
                >
                  <optgroup label="Institucionales y Capacitaciones">
                    {CATEGORIAS_PUBLICACION.filter(
                      (cat) => cat.grupo === "institucional",
                    ).map((cat) => (
                      <option key={cat.codigo} value={cat.codigo}>
                        {cat.etiqueta}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Divulgación Técnica">
                    {CATEGORIAS_PUBLICACION.filter(
                      (cat) => cat.grupo === "tecnico",
                    ).map((cat) => (
                      <option key={cat.codigo} value={cat.codigo}>
                        {cat.etiqueta}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pub-sector"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  Área o sector vinculado *
                </label>
                <select
                  id="pub-sector"
                  name="sector"
                  required
                  value={form.sector}
                  onChange={handleChange}
                  className="input-base"
                >
                  <option value="">Seleccionar sector…</option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.codigo}>
                      {sector.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pub-imagen-url"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  Imagen o recurso visual (URL opcional)
                </label>
                <input
                  id="pub-imagen-url"
                  name="imagen_url"
                  type="url"
                  placeholder="https://ejemplo.gob.ar/recursos/flyer-jornada.jpg"
                  value={form.imagen_url}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="pub-archivo-tipo"
                    className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                  >
                    Tipo de recurso
                  </label>
                  <select
                    id="pub-archivo-tipo"
                    name="archivo_tipo"
                    value={form.archivo_tipo}
                    onChange={handleChange}
                    className="input-base"
                  >
                    <option value="imagen">Imagen</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="pub-archivo-nombre"
                    className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                  >
                    Epígrafe / Nombre
                  </label>
                  <input
                    id="pub-archivo-nombre"
                    name="archivo_nombre"
                    placeholder="Afiche oficial"
                    value={form.archivo_nombre}
                    onChange={handleChange}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="pub-contenido"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  Descripción o contenido *
                </label>
                <textarea
                  id="pub-contenido"
                  name="contenido"
                  required
                  rows={5}
                  placeholder="Desarrollá la información completa de la noticia, temario de la capacitación, fechas, requisitos y modalidades de inscripción…"
                  value={form.contenido}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#e6edf3]">
                    Publicar inmediatamente
                  </p>
                  <p className="text-xs text-[#8b949e]">
                    Si desmarcás esta opción, la publicación quedará guardada como borrador visible solo para personal CIT y administradores.
                  </p>
                </div>
                <input
                  id="pub-publicado"
                  name="publicado"
                  type="checkbox"
                  checked={form.publicado}
                  onChange={handleChange}
                  aria-label="Publicar inmediatamente"
                  className="h-4 w-4 rounded border-[#30363d] bg-[#161b22] text-[#238636] focus:ring-[#2ea043]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Guardar cambios" : "Crear publicación"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Listado de publicaciones */}
      {loading ? (
        <div
          className="grid gap-4 sm:grid-cols-2"
          aria-busy="true"
          aria-label="Cargando publicaciones"
        >
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : publicacionesFiltradas.length === 0 ? (
        <EmptyState
          title="No se encontraron publicaciones"
          description={
            publicaciones.length === 0
              ? "Todavía no hay publicaciones cargadas en la plataforma."
              : "Ninguna publicación coincide con los filtros o la búsqueda actual."
          }
          action={
            publicaciones.length > 0 ? (
              <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            ) : isCIT ? (
              <Button variant="primary" size="sm" onClick={openCreate}>
                Crear la primera publicación
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {publicacionesFiltradas.map((publicacion) => {
            const metaCat = obtenerMetaCategoriaPublicacion(
              publicacion.tipo_contenido,
            );
            const archivos = publicacion.Archivo ?? [];
            const imagenDestacada = archivos.find(
              (item) => item.tipo === "imagen" && item.archivo_url,
            );
            const autorVisible = publicacion.Autor
              ? obtenerNombreVisible({
                  nombre: publicacion.Autor.Profile?.first_name,
                  apellido: publicacion.Autor.Profile?.last_name,
                  username: publicacion.Autor.username,
                })
              : null;
            const estaPublicada = publicacion.publicado !== false;

            return (
              <Card
                key={publicacion.id}
                noPadding
                className="flex flex-col overflow-hidden transition-colors hover:border-[#8b949e]/60"
              >
                {imagenDestacada && (
                  <div className="h-44 w-full overflow-hidden border-b border-[#30363d] bg-[#0d1117]">
                    <img
                      src={imagenDestacada.archivo_url}
                      alt={
                        imagenDestacada.archivo_nombre ||
                        `Imagen de ${publicacion.titulo}`
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={metaCat.badgeVariant}>
                        {metaCat.etiqueta}
                      </Badge>
                      <Badge variant="neutral">
                        {publicacion.Sector?.nombre || "General"}
                      </Badge>
                    </div>

                    {isCIT && (
                      <Badge
                        variant={estaPublicada ? "success" : "warning"}
                      >
                        {estaPublicada ? "Publicada" : "No publicada"}
                      </Badge>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-[#e6edf3]">
                    <Link
                      to={`/publicaciones/${publicacion.id}`}
                      className="hover:text-[#58a6ff] hover:underline"
                    >
                      {publicacion.titulo}
                    </Link>
                  </h2>

                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#8b949e]">
                    {publicacion.contenido}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#21262d] pt-3 text-xs text-[#8b949e]">
                    <div className="space-y-0.5">
                      <p>
                        Publicado el {formatearFecha(publicacion.createdAt)}
                        {autorVisible ? ` · Por ${autorVisible}` : ""}
                      </p>
                      {archivos.length > 0 && (
                        <p className="text-[#58a6ff]">
                          {archivos.length}{" "}
                          {archivos.length === 1
                            ? "recurso visual adjunto"
                            : "recursos visuales adjuntos"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/publicaciones/${publicacion.id}`}
                        className="inline-flex items-center rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#e6edf3] transition-colors hover:bg-[#30363d]"
                      >
                        Leer publicación
                      </Link>

                      {isCIT && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(publicacion)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            loading={togglingId === publicacion.id}
                            onClick={() => void handleTogglePublicado(publicacion)}
                          >
                            {estaPublicada ? "Despublicar" : "Publicar"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            loading={deletingId === publicacion.id}
                            onClick={() => void handleDelete(publicacion)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
