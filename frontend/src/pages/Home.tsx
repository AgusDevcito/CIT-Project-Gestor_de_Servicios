import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import logoCitio from "../assets/logo-CITio.png";
import { Alert } from "../components/ui/Alert";
import { Badge, badgeVariantPorRol } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import type { ResumenMetricas } from "../domain/entidades";
import { esPersonalCIT, labelDeRol } from "../domain/roles";
import { obtenerNombreVisible } from "../lib/formatters";
import {
  getResumenMetricas,
  METRICAS_VACIAS,
} from "../services/metricasService";

export default function Home() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);
  const displayName = user ? obtenerNombreVisible(user) : "";

  const [metricas, setMetricas] = useState<ResumenMetricas>(METRICAS_VACIAS);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  const [errorMetricas, setErrorMetricas] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingMetricas(true);
    setErrorMetricas(false);
    getResumenMetricas()
      .then((data) => {
        if (active && data) {
          setMetricas(data);
        }
      })
      .catch(() => {
        // Sin backend o con error: se avisa en pantalla para no mostrar ceros como si fueran datos reales
        if (active) setErrorMetricas(true);
      })
      .finally(() => {
        if (active) setLoadingMetricas(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalSolicitudes = Math.max(metricas.solicitudes_totales, 1);
  const pctFinalizadas = Math.round(
    (metricas.distribucion_solicitudes.finalizadas / totalSolicitudes) * 100,
  );
  const pctEnCurso = Math.round(
    (metricas.distribucion_solicitudes.en_curso / totalSolicitudes) * 100,
  );
  const pctPendientes = Math.round(
    (metricas.distribucion_solicitudes.pendientes / totalSolicitudes) * 100,
  );

  const totalPropuestas = Math.max(metricas.propuestas_recibidas, 1);
  const pctPropuestasConvertidas = Math.round(
    (metricas.propuestas_convertidas / totalPropuestas) * 100,
  );

  return (
    <div className="space-y-8">
      {/* 1. Hero / Bienvenida personalizada o general */}
      <section
        aria-label="Bienvenida institucional"
        className="overflow-hidden rounded-xl border border-cit-forest-border/50 bg-gradient-to-br from-cit-forest via-cit-forest-raised to-gh-canvas p-6 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={logoCitio}
              alt="Logo CITio"
              className="h-20 w-20 shrink-0 rounded-xl border border-cit-forest-border/60 bg-gh-canvas/60 p-2 object-contain"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">CONICET · UNaF · Provincia de Formosa</Badge>
                {user && (
                  <Badge variant={badgeVariantPorRol(user.rol)}>
                    {labelDeRol(user.rol)}
                  </Badge>
                )}
              </div>

              <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {user ? (
                  <>
                    Hola, <span className="text-cit-accent-emphasis">{displayName}</span>
                  </>
                ) : (
                  "Bienvenido a CITio"
                )}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gh-text sm:text-base">
                {user
                  ? "Te damos la bienvenida a la plataforma de gestión de servicios, divulgación científica y vinculación tecnológica del Centro de Investigaciones y Transferencia de Formosa."
                  : "Plataforma digital del Centro de Investigaciones y Transferencia de Formosa para la consulta de servicios tecnológicos, publicaciones científicas y vinculación con el sector productivo."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <LinkButton to="/servicios">
                  {isCIT ? "Gestionar Servicios" : "Explorar Servicios"}
                </LinkButton>
                <LinkButton to="/proponer" variant="secondary">
                  {isCIT ? "Revisar Propuestas" : "Presentar Propuesta"}
                </LinkButton>
              </>
            ) : (
              <>
                <LinkButton to="/login">
                  Iniciar sesión
                </LinkButton>
                <LinkButton to="/register" variant="secondary">
                  Crear cuenta
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Panel Visual de Métricas e Impacto Provincial (Nivel 3) */}
      <section aria-labelledby="heading-metricas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="heading-metricas" className="text-lg font-semibold text-white">
              Panel Visual de Métricas e Impacto
            </h2>
            <p className="text-xs text-gh-muted">
              Indicadores de transferencia tecnológica, servicios, propuestas y formación del CIT Formosa.
            </p>
          </div>
          {errorMetricas ? (
            <Badge variant="warning">Datos no disponibles</Badge>
          ) : (
            <Badge variant="info">Actualizado al abrir la página</Badge>
          )}
        </div>

        {errorMetricas && !loadingMetricas && (
          <Alert variant="warning" title="No pudimos cargar las métricas">
            Los indicadores no están disponibles en este momento. Los valores en cero
            que se muestran abajo no reflejan la actividad real del CIT.
          </Alert>
        )}

        {loadingMetricas ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="space-y-2 border-cit-accent/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gh-muted">
                    Servicios en Catálogo
                  </span>
                  <Badge variant="success">STAN / CIT</Badge>
                </div>
                <p
                  data-testid="kpi-servicios-activos"
                  className="text-3xl font-bold text-white"
                >
                  {metricas.servicios_activos}
                </p>
                <p className="text-xs text-cit-accent-emphasis">
                  Ensayos y diagnósticos habilitados
                </p>
              </Card>

              <Card className="space-y-2 border-gh-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gh-muted">
                    Propuestas Convertidas
                  </span>
                  <Badge variant="info">De campo a servicio</Badge>
                </div>
                <p
                  data-testid="kpi-propuestas-convertidas"
                  className="text-3xl font-bold text-white"
                >
                  {metricas.propuestas_convertidas}
                  <span className="ml-1.5 text-sm font-normal text-gh-muted">
                    / {metricas.propuestas_recibidas} recibidas
                  </span>
                </p>
                <p className="text-xs text-status-info">
                  Problemáticas incorporadas al catálogo
                </p>
              </Card>

              <Card className="space-y-2 border-gh-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gh-muted">
                    Resultados Digitales (PDF)
                  </span>
                  <Badge variant="success">Trazabilidad</Badge>
                </div>
                <p
                  data-testid="kpi-resultados-entregados"
                  className="text-3xl font-bold text-white"
                >
                  {metricas.resultados_entregados}
                  <span className="ml-1.5 text-sm font-normal text-gh-muted">
                    / {metricas.solicitudes_totales} solicitudes
                  </span>
                </p>
                <p className="text-xs text-cit-accent-emphasis">
                  Informes oficiales descargables sin viajar
                </p>
              </Card>

              <Card className="space-y-2 border-gh-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gh-muted">
                    Formación y Valoración
                  </span>
                  <Badge variant="warning">
                    {metricas.calificacion_promedio > 0
                      ? `${metricas.calificacion_promedio} ★`
                      : "Calidad CIT"}
                  </Badge>
                </div>
                <p
                  data-testid="kpi-inscripciones-capacitaciones"
                  className="text-3xl font-bold text-white"
                >
                  {metricas.inscripciones_capacitaciones}
                  <span className="ml-1.5 text-sm font-normal text-gh-muted">
                    inscripciones
                  </span>
                </p>
                <p className="text-xs text-status-warning">
                  {metricas.capacitaciones_activas} capacitaciones activas ·{" "}
                  {metricas.total_resenas} reseñas
                </p>
              </Card>
            </div>

            {/* Barras visuales de distribución y conversión */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Estado de Solicitudes Técnicas
                  </h3>
                  <span className="text-xs text-gh-muted">
                    {metricas.solicitudes_totales} registradas
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-gh-muted">
                        Finalizadas con informe
                      </span>
                      <span className="font-semibold text-cit-accent-emphasis">
                        {metricas.distribucion_solicitudes.finalizadas}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gh-elevated">
                      <div
                        className="h-full rounded-full bg-cit-accent transition-all"
                        style={{ width: `${pctFinalizadas}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-gh-muted">
                        En curso / En laboratorio
                      </span>
                      <span className="font-semibold text-status-info">
                        {metricas.distribucion_solicitudes.en_curso}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gh-elevated">
                      <div
                        className="h-full rounded-full bg-status-info-emphasis transition-all"
                        style={{ width: `${pctEnCurso}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-gh-muted">
                        Pendientes de asignación
                      </span>
                      <span className="font-semibold text-status-warning">
                        {metricas.distribucion_solicitudes.pendientes}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gh-elevated">
                      <div
                        className="h-full rounded-full bg-status-warning transition-all"
                        style={{ width: `${pctPendientes}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Circuito &ldquo;De Problemática a Servicio Oficial&rdquo;
                    </h3>
                    <Badge variant="success">Vinculación Productiva</Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-gh-muted">
                    Las problemáticas enviadas por productores y cooperativas desde{" "}
                    <strong className="text-gh-text">Proponer</strong> son evaluadas por investigadores del CIT y se transforman en servicios permanentes para toda la provincia.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gh-muted">
                      Propuestas aprobadas e integradas al catálogo
                    </span>
                    <span className="font-semibold text-cit-accent-emphasis">
                      {metricas.propuestas_convertidas} de{" "}
                      {metricas.propuestas_recibidas}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gh-elevated">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cit-accent to-cit-accent-emphasis transition-all"
                      style={{ width: `${pctPropuestasConvertidas}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </section>

      {/* 3. Accesos visuales a las secciones principales */}
      <section aria-labelledby="heading-accesos">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="heading-accesos" className="text-lg font-semibold text-white">
            Accesos rápidos a la plataforma
          </h2>
          <span className="text-xs text-gh-muted">
            Navegación directa por módulos
          </span>
        </div>

        <div
          className={`grid gap-3 sm:grid-cols-2 ${
            isCIT ? "lg:grid-cols-5" : "lg:grid-cols-4"
          }`}
        >
          <Link
            to="/servicios"
            className="group flex flex-col justify-between rounded-lg border border-gh-border bg-gh-surface p-4 transition-colors hover:border-cit-accent-emphasis hover:bg-gh-overlay"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-cit-accent-emphasis">
                  Servicios
                </span>
                <span className="text-xs text-cit-accent-emphasis">→</span>
              </div>
              <p className="mt-1.5 text-xs text-gh-muted">
                Catálogo de análisis clínicos, diagnósticos y ensayos del CIT.
              </p>
            </div>
          </Link>

          <Link
            to="/capacitaciones"
            className="group flex flex-col justify-between rounded-lg border border-gh-border bg-gh-surface p-4 transition-colors hover:border-cit-accent-emphasis hover:bg-gh-overlay"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-cit-accent-emphasis">
                  Capacitaciones
                </span>
                <span className="text-xs text-cit-accent-emphasis">→</span>
              </div>
              <p className="mt-1.5 text-xs text-gh-muted">
                Talleres técnicos, jornadas de campo e inscripción en línea.
              </p>
            </div>
          </Link>

          {isCIT && (
            <Link
              to="/solicitudes"
              className="group flex flex-col justify-between rounded-lg border border-gh-border bg-gh-surface p-4 transition-colors hover:border-cit-accent-emphasis hover:bg-gh-overlay"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white group-hover:text-cit-accent-emphasis">
                    Solicitudes
                  </span>
                  <span className="text-xs text-cit-accent-emphasis">→</span>
                </div>
                <p className="mt-1.5 text-xs text-gh-muted">
                  Bandeja interna de revisión, dictamen y entrega de resultados.
                </p>
              </div>
            </Link>
          )}

          <Link
            to="/publicaciones"
            className="group flex flex-col justify-between rounded-lg border border-gh-border bg-gh-surface p-4 transition-colors hover:border-cit-accent-emphasis hover:bg-gh-overlay"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-cit-accent-emphasis">
                  Publicaciones
                </span>
                <span className="text-xs text-cit-accent-emphasis">→</span>
              </div>
              <p className="mt-1.5 text-xs text-gh-muted">
                Artículos técnicos sobre patologías, enfermedades, parásitos y plagas.
              </p>
            </div>
          </Link>

          <Link
            to="/proponer"
            className="group flex flex-col justify-between rounded-lg border border-gh-border bg-gh-surface p-4 transition-colors hover:border-cit-accent-emphasis hover:bg-gh-overlay"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-cit-accent-emphasis">
                  Proponer
                </span>
                <span className="text-xs text-cit-accent-emphasis">→</span>
              </div>
              <p className="mt-1.5 text-xs text-gh-muted">
                {isCIT
                  ? "Evaluación y dictamen técnico de problemáticas agropecuarias."
                  : "Presentación de problemáticas productivas para vinculación con el CIT."}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Sección Institucional: ¿Qué es el CIT Formosa? y ¿Qué es CITio? */}
      <section
        aria-label="Información institucional sobre CIT Formosa y CITio"
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Sobre el CIT Formosa
              </h2>
              <Badge variant="success">Unidad Ejecutora</Badge>
            </div>
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-gh-text">
            <p>
              El <strong>Centro de Investigaciones y Transferencia de Formosa (CIT Formosa)</strong> es
              una institución científica y tecnológica de triple dependencia conformada por el{" "}
              <strong>CONICET</strong>, la <strong>Universidad Nacional de Formosa (UNaF)</strong> y el{" "}
              <strong>Gobierno de la Provincia de Formosa</strong>, creada en 2013 dentro del ámbito del
              CONICET Nordeste.
            </p>
            <div>
              <h3 className="font-semibold text-cit-accent-emphasis">
                ¿A qué se dedica y qué actividades desarrolla?
              </h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-xs text-gh-muted sm:text-sm">
                <li>
                  <strong>Investigación aplicada:</strong> Desarrollo de líneas en Bacteriología,
                  Virología, Parasitología, Hemoparásitos y Ectoparásitos.
                </li>
                <li>
                  <strong>Biotecnología agropecuaria:</strong> Biotecnología vegetal y animal,
                  producción frutihortícola, cultivos alternativos, sanidad y reproducción de animales
                  domésticos y silvestres.
                </li>
                <li>
                  <strong>Transferencia y Servicios (STAN):</strong> Prestación de servicios de
                  diagnóstico clínico, serológico y parasitológico para productores, profesionales y
                  organismos de la región.
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Sobre la Plataforma CITio
              </h2>
              <Badge variant="info">Vinculación Digital</Badge>
            </div>
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-gh-text">
            <p>
              <strong>CITio</strong> es el sistema web de gestión de servicios y transferencia del CIT
              Formosa, diseñado para conectar de forma directa a productores agropecuarios, profesionales
              veterinarios e instituciones con las capacidades técnicas del Centro.
            </p>
            <div>
              <h3 className="font-semibold text-cit-accent-emphasis">
                Objetivo y problemas que resuelve
              </h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-xs text-gh-muted sm:text-sm">
                <li>
                  <strong>Acceso unificado al catálogo:</strong> Centraliza la oferta de ensayos,
                  condiciones de muestra y aranceles en un único catálogo transparente.
                </li>
                <li>
                  <strong>Trazabilidad de solicitudes y resultados PDF:</strong> Permite solicitar análisis en línea, seguir el avance y descargar informes oficiales sin viajar.
                </li>
                <li>
                  <strong>Canal de problemáticas productivas:</strong> Permite presentar propuestas
                  agropecuarias y recibir un dictamen técnico fundamentado por especialistas del CIT.
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
