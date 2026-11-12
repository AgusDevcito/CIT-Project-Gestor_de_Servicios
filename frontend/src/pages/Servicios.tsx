import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "../components/ui/Alert";
import { Badge, badgeVariantPorEstado } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchFilterBar } from "../components/ui/SearchFilterBar";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/useAuth";
import type { Sector, Servicio, Solicitud } from "../domain/entidades";
import { getApiError } from "../domain/errors";
import { esPersonalCIT } from "../domain/roles";
import { formatearPrecio, obtenerNombreVisible } from "../lib/formatters";
import {
  getSectores,
  SECTORES_OFICIALES_CIT,
} from "../services/catalogosService";
import {
  createServicio,
  deleteServicio,
  getServicios,
} from "../services/serviciosService";
import { createSolicitud, getSolicitudes } from "../services/solicitudesService";

interface FormularioServicio {
  servicio_nombre: string;
  servicio_description: string;
  servicio_precio: string;
  sector: string;
  servicio_img: string;
}

const INITIAL_FORM: FormularioServicio = {
  servicio_nombre: "",
  servicio_description: "",
  servicio_precio: "",
  sector: "",
  servicio_img: "",
};

const ESTADOS_ACTIVOS = new Set(["PENDIENTE", "APROBADO", "ACEPTADA"]);

export default function Servicios() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [solicitudesUsuario, setSolicitudesUsuario] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filtros de búsqueda y sector
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");

  // Alta de nuevo servicio (exclusivo CIT/Admin)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormularioServicio>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Estado de contratación por servicio
  const [solicitandoId, setSolicitandoId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const sectoresPromise = getSectores().catch(() => SECTORES_OFICIALES_CIT);
    try {
      const [serviciosData, sectoresData, solicitudesData] = await Promise.all([
        getServicios(),
        sectoresPromise,
        user && !isCIT ? getSolicitudes().catch(() => []) : Promise.resolve([]),
      ]);
      setServicios(serviciosData);
      setSectores(
        sectoresData.length > 0 ? sectoresData : SECTORES_OFICIALES_CIT,
      );
      setSolicitudesUsuario(solicitudesData);
    } catch (err) {
      const sectoresFallback = await sectoresPromise;
      setSectores(
        sectoresFallback.length > 0 ? sectoresFallback : SECTORES_OFICIALES_CIT,
      );
      setError(getApiError(err, "No se pudieron cargar los servicios."));
    } finally {
      setLoading(false);
    }
  }, [user, isCIT]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Mapa rápido de solicitudes activas por servicio_id para evitar duplicados
  const solicitudActivaPorServicio = useMemo(() => {
    const mapa = new Map<number, Solicitud>();
    for (const sol of solicitudesUsuario) {
      const codigo = sol.Estado?.codigo?.toUpperCase() ?? "PENDIENTE";
      if (ESTADOS_ACTIVOS.has(codigo) && !mapa.has(sol.servicio_id)) {
        mapa.set(sol.servicio_id, sol);
      }
    }
    return mapa;
  }, [solicitudesUsuario]);

  const serviciosFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return servicios.filter((srv) => {
      const coincideSector =
        !sectorFilter || srv.Sector?.codigo === sectorFilter;
      const coincideTexto =
        !q ||
        srv.servicio_nombre.toLowerCase().includes(q) ||
        srv.servicio_description.toLowerCase().includes(q) ||
        (srv.Sector?.nombre.toLowerCase().includes(q) ?? false);
      return coincideSector && coincideTexto;
    });
  }, [servicios, searchQuery, sectorFilter]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    const nombre = form.servicio_nombre.trim();
    const descripcion = form.servicio_description.trim();
    const precio = Number(form.servicio_precio);

    if (!nombre || !descripcion || !form.sector) {
      setError("Completá el nombre, el sector y la descripción del servicio.");
      return;
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setError("El arancel debe ser un número mayor o igual a 0.");
      return;
    }

    setSaving(true);
    try {
      await createServicio({
        servicio_nombre: nombre,
        servicio_description: descripcion,
        servicio_precio: precio,
        sector: form.sector,
        servicio_img: form.servicio_img.trim() || undefined,
      });
      setForm(INITIAL_FORM);
      setShowForm(false);
      setFeedback("Servicio publicado correctamente en el catálogo.");
      await loadData();
    } catch (err) {
      setError(getApiError(err, "No se pudo crear el servicio."));
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitar = async (servicio: Servicio) => {
    if (solicitudActivaPorServicio.has(servicio.id)) {
      setError("Ya tenés una solicitud en curso para este servicio.");
      return;
    }

    setError("");
    setFeedback("");
    setSolicitandoId(servicio.id);
    try {
      const nuevaSolicitud = await createSolicitud(servicio.id);
      setSolicitudesUsuario((prev) => [nuevaSolicitud, ...prev]);
      setFeedback(
        `Solicitud registrada para "${servicio.servicio_nombre}". Podés seguir su estado en Solicitudes.`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo solicitar el servicio."));
    } finally {
      setSolicitandoId(null);
    }
  };

  const handleDelete = async (servicio: Servicio) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar el servicio "${servicio.servicio_nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingId(servicio.id);
    try {
      await deleteServicio(servicio.id);
      setServicios((prev) => prev.filter((item) => item.id !== servicio.id));
      setFeedback(
        `El servicio "${servicio.servicio_nombre}" fue eliminado exitosamente.`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar el servicio."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de análisis, diagnósticos y servicios tecnológicos brindados por el CIT Formosa."
        count={!loading ? servicios.length : undefined}
        actions={
          isCIT ? (
            <Button
              variant={showForm ? "secondary" : "primary"}
              onClick={() => setShowForm((prev) => !prev)}
            >
              {showForm ? "Cancelar" : "+ Nuevo servicio"}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{feedback}</span>
            <Link
              to="/solicitudes"
              className="font-semibold underline hover:text-white"
            >
              Ver mis solicitudes →
            </Link>
          </div>
        </Alert>
      )}

      {/* Formulario de alta (exclusivo CIT / Admin) */}
      {isCIT && showForm && (
        <Card
          header={
            <h2 className="text-sm font-semibold text-[#3fb950]">
              Publicar nuevo servicio en el catálogo
            </h2>
          }
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="servicio_nombre"
                  className="mb-1 block text-xs font-medium text-[#8b949e]"
                >
                  Nombre del servicio *
                </label>
                <input
                  id="servicio_nombre"
                  name="servicio_nombre"
                  required
                  maxLength={120}
                  placeholder="Ej. Análisis Coprológico Cuantitativo (HPG)"
                  value={form.servicio_nombre}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="servicio_precio"
                  className="mb-1 block text-xs font-medium text-[#8b949e]"
                >
                  Arancel en ARS (0 para &ldquo;Consultar&rdquo;) *
                </label>
                <input
                  id="servicio_precio"
                  name="servicio_precio"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Precio"
                  value={form.servicio_precio}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="sector"
                  className="mb-1 block text-xs font-medium text-[#8b949e]"
                >
                  Área / Sector *
                </label>
                <select
                  id="sector"
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
                  htmlFor="servicio_img"
                  className="mb-1 block text-xs font-medium text-[#8b949e]"
                >
                  URL de imagen o documentación (opcional)
                </label>
                <input
                  id="servicio_img"
                  name="servicio_img"
                  type="url"
                  placeholder="URL de imagen (opcional)"
                  value={form.servicio_img}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="servicio_description"
                  className="mb-1 block text-xs font-medium text-[#8b949e]"
                >
                  Descripción, características y requisitos de muestra *
                </label>
                <textarea
                  id="servicio_description"
                  name="servicio_description"
                  required
                  maxLength={350}
                  rows={3}
                  placeholder="Descripción del servicio"
                  value={form.servicio_description}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                {saving ? "Guardando…" : "Crear servicio"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Barra de búsqueda y filtro por sector */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar servicio por nombre, descripción o área…"
      >
        <select
          aria-label="Filtrar por sector"
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-[#3fb950]"
        >
          <option value="">Todos los sectores</option>
          {sectores.map((sector) => (
            <option key={sector.id} value={sector.codigo}>
              {sector.nombre}
            </option>
          ))}
        </select>
      </SearchFilterBar>

      {/* Listado de servicios */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx}>
              <Skeleton lines={4} />
            </Card>
          ))}
        </div>
      ) : serviciosFiltrados.length === 0 ? (
        <EmptyState
          title={
            servicios.length === 0
              ? "Todavía no hay servicios publicados"
              : "No se encontraron servicios con esos filtros"
          }
          description={
            servicios.length === 0
              ? "Cuando el personal del CIT publique servicios en el catálogo aparecerán listados aquí."
              : "Probá cambiando el término de búsqueda o seleccionando otro sector."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviciosFiltrados.map((servicio) => {
            const solicitudActiva = solicitudActivaPorServicio.get(servicio.id);
            const totalResenas = servicio.totalResenas ?? servicio.Resenas?.length ?? 0;
            const promedio = servicio.promedioCalificacion ?? null;
            const proveedorNombre = servicio.Proveedor
              ? obtenerNombreVisible({
                  nombre: servicio.Proveedor.Profile?.first_name,
                  apellido: servicio.Proveedor.Profile?.last_name,
                  username: servicio.Proveedor.username,
                })
              : "CIT Formosa";

            return (
              <Card
                key={servicio.id}
                noPadding
                className="flex flex-col justify-between transition-colors hover:border-[#447232]"
              >
                <div>
                  {servicio.servicio_img && (
                    <img
                      src={servicio.servicio_img}
                      alt={servicio.servicio_nombre}
                      className="h-40 w-full border-b border-[#30363d] object-cover"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="info">
                        {servicio.Sector?.nombre || "Sin sector"}
                      </Badge>
                      {promedio !== null && totalResenas > 0 ? (
                        <span
                          aria-label={`Calificación promedio ${promedio} de 5`}
                          className="inline-flex items-center gap-1 rounded-full border border-[#9e6a03]/50 bg-[#9e6a03]/15 px-2 py-0.5 text-xs font-semibold text-[#d29922]"
                        >
                          ★ {promedio.toFixed(1)}{" "}
                          <span className="font-normal text-[#8b949e]">
                            ({totalResenas})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#8b949e]">
                          Sin calificaciones
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2.5 text-base font-semibold text-white">
                      <Link
                        to={`/servicios/${servicio.id}`}
                        className="hover:text-[#3fb950] hover:underline"
                      >
                        {servicio.servicio_nombre}
                      </Link>
                    </h2>

                    <p className="mt-1.5 line-clamp-3 text-sm text-slate-300">
                      {servicio.servicio_description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#30363d] bg-[#0d1117]/50 px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#3fb950]">
                        {formatearPrecio(servicio.servicio_precio)}
                      </p>
                      <p className="text-xs text-[#8b949e]">
                        Responsable: {proveedorNombre}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/servicios/${servicio.id}`}
                        className="rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1.5 text-xs font-medium text-[#e6edf3] transition-colors hover:border-[#8b949e] hover:bg-[#30363d]"
                      >
                        Ver detalle
                      </Link>

                      {isCIT && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === servicio.id}
                          onClick={() => void handleDelete(servicio)}
                          aria-label={`Eliminar ${servicio.servicio_nombre}`}
                        >
                          Eliminar
                        </Button>
                      )}

                      {!isCIT &&
                        (solicitudActiva ? (
                          <Badge
                            variant={badgeVariantPorEstado(
                              solicitudActiva.Estado?.codigo ?? "PENDIENTE",
                            )}
                          >
                            Ya solicitado (
                            {solicitudActiva.Estado?.nombre ?? "Pendiente"})
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            loading={solicitandoId === servicio.id}
                            onClick={() => void handleSolicitar(servicio)}
                          >
                            Solicitar
                          </Button>
                        ))}
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
