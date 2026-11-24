import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  SearchFilterBar,
  Skeleton,
  StatusTimeline,
  type TimelineStep,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type {
  EstadoInscripcionCapacitacion,
  InscripcionCapacitacion,
  Publicacion,
  Sector,
} from "../domain/entidades";
import { obtenerMetaCategoriaPublicacion } from "../domain/publicaciones";
import { esPersonalCIT } from "../domain/roles";
import {
  formatearFecha,
  obtenerNombreVisible,
  recortarTexto,
} from "../lib/formatters";
import {
  getSectores,
  SECTORES_OFICIALES_CIT,
} from "../services/catalogosService";
import {
  enrollInCapacitacion,
  getInscriptosCapacitacion,
  getMisCapacitaciones,
  updateEstadoInscripcionCapacitacion,
} from "../services/profileService";
import { getPublicaciones } from "../services/publicacionesService";

const TIPOS_FORMATIVOS = new Set(["capacitacion", "jornada", "inscripcion"]);

const ESTADOS_CURSADA: readonly {
  codigo: EstadoInscripcionCapacitacion;
  etiqueta: string;
}[] = [
  { codigo: "INSCRIPTO", etiqueta: "Inscripto" },
  { codigo: "EN_CURSO", etiqueta: "En curso" },
  { codigo: "FINALIZADO", etiqueta: "Finalizado" },
];

export function buildCapacitacionTimelineSteps(
  inscripcion: InscripcionCapacitacion,
): TimelineStep[] {
  const estado = (inscripcion.estado ?? "INSCRIPTO").toUpperCase();
  const fechaInscripcion = formatearFecha(inscripcion.createdAt);

  if (estado === "FINALIZADO") {
    return [
      {
        id: "inscripto",
        label: "1. Inscripto",
        date: fechaInscripcion,
        description: "Cupo confirmado en la capacitación.",
        status: "completed",
      },
      {
        id: "cursando",
        label: "2. En curso",
        description: "Participación y asistencia validadas.",
        status: "completed",
      },
      {
        id: "finalizado",
        label: "3. Finalizado",
        description:
          inscripcion.observaciones || "Actividad formativa completada.",
        status: "completed",
      },
    ];
  }

  if (estado === "EN_CURSO") {
    return [
      {
        id: "inscripto",
        label: "1. Inscripto",
        date: fechaInscripcion,
        description: "Inscripción registrada.",
        status: "completed",
      },
      {
        id: "cursando",
        label: "2. En curso",
        description:
          inscripcion.observaciones ||
          "Cursada o jornada actualmente en desarrollo.",
        status: "current",
      },
      {
        id: "finalizado",
        label: "3. Finalizado",
        description: "Acreditación al concluir la actividad.",
        status: "upcoming",
      },
    ];
  }

  return [
    {
      id: "inscripto",
      label: "1. Inscripto",
      date: fechaInscripcion,
      description: "Tu lugar quedó reservado en la actividad.",
      status: "current",
    },
    {
      id: "cursando",
      label: "2. En curso",
      description: "Inicio de clases o jornada técnica.",
      status: "upcoming",
    },
    {
      id: "finalizado",
      label: "3. Finalizado",
      description: "Cierre y registro de participación.",
      status: "upcoming",
    },
  ];
}

export default function Capacitaciones() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);

  const [capacitaciones, setCapacitaciones] = useState<Publicacion[]>([]);
  const [misInscripciones, setMisInscripciones] = useState<
    InscripcionCapacitacion[]
  >([]);
  const [sectores, setSectores] = useState<Sector[]>(SECTORES_OFICIALES_CIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [sectorFiltro, setSectorFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");

  // Inscripción en 1 clic
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  // Modal de gestión de inscriptos (solo CIT/Admin)
  const [capacitacionActivaCIT, setCapacitacionActivaCIT] =
    useState<Publicacion | null>(null);
  const [inscriptosCIT, setInscriptosCIT] = useState<InscripcionCapacitacion[]>(
    [],
  );
  const [loadingInscriptos, setLoadingInscriptos] = useState(false);
  const [updatingInscripcionId, setUpdatingInscripcionId] = useState<
    number | null
  >(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");

    const sectoresPromise = getSectores().catch(() => SECTORES_OFICIALES_CIT);
    const misInscripcionesPromise = user
      ? getMisCapacitaciones().catch(() => [] as InscripcionCapacitacion[])
      : Promise.resolve([] as InscripcionCapacitacion[]);

    try {
      const [publicacionesData, sectoresData, inscripcionesData] =
        await Promise.all([
          getPublicaciones(),
          sectoresPromise,
          misInscripcionesPromise,
        ]);

      const soloFormativas = publicacionesData.filter((pub) =>
        TIPOS_FORMATIVOS.has(pub.tipo_contenido),
      );
      setCapacitaciones(soloFormativas);
      setSectores(
        sectoresData.length > 0 ? sectoresData : SECTORES_OFICIALES_CIT,
      );
      setMisInscripciones(inscripcionesData);
    } catch (err) {
      setError(
        getApiError(err, "No se pudieron cargar las capacitaciones del CIT."),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const mapaInscripciones = useMemo(() => {
    const map = new Map<number, InscripcionCapacitacion>();
    for (const item of misInscripciones) {
      map.set(item.publicacion_id, item);
    }
    return map;
  }, [misInscripciones]);

  const capacitacionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return capacitaciones.filter((pub) => {
      if (tipoFiltro && pub.tipo_contenido !== tipoFiltro) return false;
      if (
        sectorFiltro &&
        String(pub.sector_id) !== sectorFiltro &&
        pub.Sector?.codigo !== sectorFiltro
      ) {
        return false;
      }
      if (!q) return true;
      return (
        pub.titulo.toLowerCase().includes(q) ||
        pub.contenido.toLowerCase().includes(q) ||
        (pub.Sector?.nombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [capacitaciones, busqueda, sectorFiltro, tipoFiltro]);

  const handleInscribirse = async (pub: Publicacion) => {
    if (!user) return;
    setError("");
    setFeedback("");
    setEnrollingId(pub.id);
    try {
      const res = await enrollInCapacitacion(pub.id);
      setMisInscripciones((prev) => [
        res.data,
        ...prev.filter((i) => i.publicacion_id !== pub.id),
      ]);
      setFeedback(
        res.msg ||
          `Te inscribiste correctamente en "${pub.titulo}". Podés seguir tu cursada desde Mis Servicios.`,
      );
    } catch (err) {
      setError(
        getApiError(err, "No se pudo registrar la inscripción a la capacitación."),
      );
    } finally {
      setEnrollingId(null);
    }
  };

  const abrirModalInscriptos = async (pub: Publicacion) => {
    setCapacitacionActivaCIT(pub);
    setLoadingInscriptos(true);
    setError("");
    try {
      const lista = await getInscriptosCapacitacion(pub.id);
      setInscriptosCIT(lista);
    } catch (err) {
      setError(
        getApiError(
          err,
          "No se pudo cargar la nómina de inscriptos de esta capacitación.",
        ),
      );
    } finally {
      setLoadingInscriptos(false);
    }
  };

  const handleCambiarEstadoInscripto = async (
    inscripcion: InscripcionCapacitacion,
    nuevoEstado: EstadoInscripcionCapacitacion,
  ) => {
    setUpdatingInscripcionId(inscripcion.id);
    setError("");
    try {
      const res = await updateEstadoInscripcionCapacitacion(
        inscripcion.id,
        nuevoEstado,
        inscripcion.observaciones,
      );
      setInscriptosCIT((prev) =>
        prev.map((item) => (item.id === inscripcion.id ? res.data : item)),
      );
      setMisInscripciones((prev) =>
        prev.map((item) => (item.id === inscripcion.id ? res.data : item)),
      );
      setFeedback("Estado de participación actualizado correctamente.");
    } catch (err) {
      setError(
        getApiError(err, "No se pudo actualizar el estado del participante."),
      );
    } finally {
      setUpdatingInscripcionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacitaciones y Jornadas Técnicas"
        subtitle="Talleres, cursos de transferencia científica y jornadas de campo organizadas por el CIT Formosa para productores y técnicos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <LinkButton to="/mis-servicios?tab=capacitaciones" variant="secondary">
                Ver mis capacitaciones ({misInscripciones.length})
              </LinkButton>
            )}
            {isCIT && (
              <LinkButton to="/publicaciones">
                Gestionar actividades en Publicaciones
              </LinkButton>
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

      <SearchFilterBar
        searchValue={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar capacitación por tema, cultivo, sanidad o localidad…"
      >
        <select
          aria-label="Filtrar por sector"
          value={sectorFiltro}
          onChange={(e) => setSectorFiltro(e.target.value)}
          className="input-base sm:w-48"
        >
          <option value="">Todos los sectores</option>
          {sectores.map((sec) => (
            <option key={sec.id} value={String(sec.id)}>
              {sec.nombre}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por modalidad"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="input-base sm:w-48"
        >
          <option value="">Todas las modalidades</option>
          <option value="capacitacion">Capacitaciones</option>
          <option value="jornada">Jornadas técnicas</option>
          <option value="inscripcion">Convocatorias abiertas</option>
        </select>
      </SearchFilterBar>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : capacitacionesFiltradas.length === 0 ? (
        <EmptyState
          title="No se encontraron capacitaciones con esos filtros"
          description="Probá limpiando los filtros de búsqueda o consultá todas las publicaciones técnicas del CIT."
          action={
            <LinkButton to="/publicaciones">
              Explorar todas las publicaciones
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {capacitacionesFiltradas.map((cap) => {
            const meta = obtenerMetaCategoriaPublicacion(cap.tipo_contenido);
            const inscripcion = mapaInscripciones.get(cap.id);

            return (
              <Card
                key={cap.id}
                className="flex flex-col justify-between space-y-4 border-gh-border"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.badgeVariant}>{meta.etiqueta}</Badge>
                      {cap.Sector?.nombre && (
                        <Badge variant="neutral">{cap.Sector.nombre}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gh-muted">
                      {formatearFecha(cap.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gh-text">
                    <Link
                      to={`/publicaciones/${cap.id}`}
                      className="hover:text-cit-accent-emphasis hover:underline"
                    >
                      {cap.titulo}
                    </Link>
                  </h2>

                  <p className="text-sm leading-relaxed text-gh-muted">
                    {recortarTexto(cap.contenido, 200)}
                  </p>

                  {inscripcion && (
                    <StatusTimeline
                      ariaLabel={`Seguimiento de capacitación ${cap.titulo}`}
                      steps={buildCapacitacionTimelineSteps(inscripcion)}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gh-elevated pt-3">
                  <Link
                    to={`/publicaciones/${cap.id}`}
                    className="text-xs font-medium text-status-info hover:underline"
                  >
                    Ver programa completo →
                  </Link>

                  <div className="flex flex-wrap items-center gap-2">
                    {isCIT && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void abrirModalInscriptos(cap)}
                      >
                        Gestionar inscriptos
                      </Button>
                    )}

                    {user ? (
                      inscripcion ? (
                        <Badge variant="success">
                          ✓{" "}
                          {ESTADOS_CURSADA.find(
                            (e) => e.codigo === inscripcion.estado,
                          )?.etiqueta ?? inscripcion.estado}
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          loading={enrollingId === cap.id}
                          onClick={() => void handleInscribirse(cap)}
                        >
                          Inscribirme
                        </Button>
                      )
                    ) : (
                      <LinkButton to="/login" variant="secondary" size="sm">
                        Iniciá sesión para inscribirte
                      </LinkButton>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal CIT para gestionar estados de los inscriptos */}
      <Modal
        open={Boolean(capacitacionActivaCIT)}
        onClose={() => setCapacitacionActivaCIT(null)}
        title={
          capacitacionActivaCIT
            ? `Inscriptos: ${capacitacionActivaCIT.titulo}`
            : "Gestión de inscriptos"
        }
      >
        {loadingInscriptos ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : inscriptosCIT.length === 0 ? (
          <p className="text-sm text-gh-muted">
            Aún no hay productores ni usuarios inscriptos en esta actividad.
          </p>
        ) : (
          <div className="space-y-3">
            {inscriptosCIT.map((item) => {
              const nombreParticipante = item.Participante
                ? obtenerNombreVisible({
                    nombre: item.Participante.Profile?.first_name,
                    apellido: item.Participante.Profile?.last_name,
                    username: item.Participante.username,
                  })
                : `Usuario #${item.user_id}`;

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gh-border bg-gh-canvas p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gh-text">
                      {nombreParticipante}
                    </p>
                    <p className="text-xs text-gh-muted">
                      {item.Participante?.email
                        ? `${item.Participante.email} · `
                        : ""}
                      Inscripto el {formatearFecha(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Estado de ${nombreParticipante}`}
                      value={item.estado}
                      disabled={updatingInscripcionId === item.id}
                      onChange={(e) =>
                        void handleCambiarEstadoInscripto(
                          item,
                          e.target.value as EstadoInscripcionCapacitacion,
                        )
                      }
                      className="input-base py-1 text-xs"
                    >
                      {ESTADOS_CURSADA.map((est) => (
                        <option key={est.codigo} value={est.codigo}>
                          {est.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
