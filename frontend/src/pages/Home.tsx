import { Link } from "react-router-dom";

import logoCitio from "../assets/logo-CITio.png";
import { Badge, badgeVariantPorRol } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { useAuth } from "../context/useAuth";
import { esPersonalCIT, labelDeRol } from "../domain/roles";
import { obtenerNombreVisible } from "../lib/formatters";

interface AreaEspecialidad {
  categoria: string;
  descripcion: string;
  ensayos: readonly string[];
}

/**
 * Catálogo institucional de referencia tomado de la documentación oficial del proyecto (`Servicios.md`)
 * y de las líneas de trabajo del CIT Formosa (CONICET - UNaF - Provincia de Formosa).
 */
const SERVICIOS_INSTITUCIONALES: readonly AreaEspecialidad[] = [
  {
    categoria: "Bioquímica Clínica",
    descripcion: "Determinaciones hematológicas y perfiles metabólicos por espectrofotometría.",
    ensayos: [
      "Hemograma completo (Sangre con EDTA)",
      "Perfil Hepático (GOT, GPT, FAL, Bilirrubina)",
      "Perfil Renal (Urea y Creatinina)",
      "Minerales (Calcio, Fósforo, Magnesio) y Proteínas Totales",
    ],
  },
  {
    categoria: "Parasitología y Ectoparásitos",
    descripcion: "Diagnóstico coproparasitológico, hemoparásitos y resistencia a acaricidas.",
    ensayos: [
      "Análisis Coprológico Cuantitativo (HPG) y Cultivo de Larvas",
      "Complejo Tristeza Bovina y Diagnóstico de Tripanosoma (Técnica de Woo)",
      "Diagnóstico de Triquinosis",
      "Bioensayos Garrapaticidas (evaluación de resistencia a campo)",
    ],
  },
  {
    categoria: "Salud Equina",
    descripcion: "Diagnóstico serológico, inmunológico y microscópico en equinos.",
    ensayos: [
      "Anemia Infecciosa Equina (Test de Coggins)",
      "Diagnóstico Inmunológico de T. evansi (ELISA)",
      "Babesiosis Equina – Piroplasmosis (extendido de sangre)",
    ],
  },
  {
    categoria: "Enfermedades Venéreas y Serología",
    descripcion: "Control sanitario reproductivo y pruebas tamiz/confirmatorias.",
    ensayos: [
      "Serología para Brucelosis (BPA y FPA por muestra)",
      "Campylobacteriosis (Inmunofluorescencia Directa – IFD)",
      "Trichomoniasis (Cultivo) y Síndrome de Vaca Vacía",
    ],
  },
] as const;

const CAPACITACIONES_Y_ACTIVIDADES = [
  {
    titulo: "Formación de Recursos Humanos Científicos",
    subtitulo: "Becarios e investigadores CONICET - UNaF",
    detalle:
      "Dirección y formación de becarios doctorales, postdoctorales e investigadores enfocados en resolver demandas del desarrollo socio-productivo de Formosa y la región NEA.",
  },
  {
    titulo: "Jornadas de Vinculación y Transferencia Tecnológica",
    subtitulo: "Articulación con productores y profesionales",
    detalle:
      "Talleres de actualización sanitaria, toma y acondicionamiento de muestras en campo, y manejo integrado de parásitos y enfermedades reproductivas junto a organismos provinciales y nacionales.",
  },
  {
    titulo: "Divulgación Técnica y Vigilancia Sanitaria",
    subtitulo: "Publicaciones sobre patologías, parásitos y plagas",
    detalle:
      "Elaboración de material técnico de consulta abierta sobre patologías regionales, biotecnología frutihortícola, cultivos alternativos y sanidad animal.",
  },
] as const;

export default function Home() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);
  const displayName = user ? obtenerNombreVisible(user) : "";

  return (
    <div className="space-y-8">
      {/* 1. Hero / Bienvenida personalizada o general */}
      <section
        aria-label="Bienvenida institucional"
        className="overflow-hidden rounded-xl border border-[#447232]/50 bg-gradient-to-br from-[#0d2e0f] via-[#14351a] to-[#0d1117] p-6 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={logoCitio}
              alt="Logo CITio"
              className="h-20 w-20 shrink-0 rounded-xl border border-[#447232]/60 bg-[#0d1117]/60 p-2 object-contain"
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
                    Hola, <span className="text-[#3fb950]">{displayName}</span>
                  </>
                ) : (
                  "Bienvenido a CITio"
                )}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                {user
                  ? "Te damos la bienvenida a la plataforma de gestión de servicios, divulgación científica y vinculación tecnológica del Centro de Investigaciones y Transferencia de Formosa."
                  : "Plataforma digital del Centro de Investigaciones y Transferencia de Formosa para la consulta de servicios tecnológicos, publicaciones científicas y vinculación con el sector productivo."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/servicios"
                  className="inline-flex items-center justify-center rounded-md bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043]"
                >
                  {isCIT ? "Gestionar Servicios" : "Explorar Servicios"}
                </Link>
                <Link
                  to="/propuestas"
                  className="inline-flex items-center justify-center rounded-md border border-[#447232] bg-[#0d1117]/70 px-4 py-2 text-sm font-medium text-[#e6edf3] transition-colors hover:border-[#3fb950] hover:bg-[#14351a]"
                >
                  {isCIT ? "Revisar Propuestas" : "Presentar Propuesta"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md bg-[#238636] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043]"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md border border-[#447232] bg-[#0d1117]/70 px-4 py-2 text-sm font-medium text-[#e6edf3] transition-colors hover:border-[#3fb950] hover:bg-[#14351a]"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Accesos visuales a las secciones principales */}
      <section aria-labelledby="heading-accesos">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="heading-accesos" className="text-lg font-semibold text-white">
            Accesos rápidos a la plataforma
          </h2>
          <span className="text-xs text-[#8b949e]">
            Navegación directa por módulos
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            to="/servicios"
            className="group flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#3fb950] hover:bg-[#1c2128]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-[#3fb950]">
                  Servicios
                </span>
                <span className="text-xs text-[#3fb950]">→</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8b949e]">
                Catálogo de análisis clínicos, diagnósticos y ensayos del CIT.
              </p>
            </div>
          </Link>

          {isCIT && (
            <Link
              to="/solicitudes"
              className="group flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#3fb950] hover:bg-[#1c2128]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white group-hover:text-[#3fb950]">
                    Solicitudes
                  </span>
                  <span className="text-xs text-[#3fb950]">→</span>
                </div>
                <p className="mt-1.5 text-xs text-[#8b949e]">
                  Bandeja interna de revisión y dictamen de propuestas de organismos.
                </p>
              </div>
            </Link>
          )}

          <Link
            to="/publicaciones"
            className="group flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#3fb950] hover:bg-[#1c2128]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-[#3fb950]">
                  Publicaciones
                </span>
                <span className="text-xs text-[#3fb950]">→</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8b949e]">
                Artículos técnicos sobre patologías, enfermedades, parásitos y plagas.
              </p>
            </div>
          </Link>

          <Link
            to="/propuestas"
            className="group flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#3fb950] hover:bg-[#1c2128]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-[#3fb950]">
                  Propuestas
                </span>
                <span className="text-xs text-[#3fb950]">→</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8b949e]">
                {isCIT
                  ? "Evaluación y dictamen técnico de problemáticas agropecuarias."
                  : "Presentación de problemáticas productivas para vinculación con el CIT."}
              </p>
            </div>
          </Link>

          <Link
            to="/perfil"
            className="group flex flex-col justify-between rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#3fb950] hover:bg-[#1c2128]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:text-[#3fb950]">
                  Mi Perfil
                </span>
                <span className="text-xs text-[#3fb950]">→</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8b949e]">
                Configuración de datos personales, avatar y credenciales de acceso.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Sección Institucional: ¿Qué es el CIT Formosa? y ¿Qué es CITio? */}
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
          <div className="space-y-3 text-sm leading-relaxed text-[#e6edf3]">
            <p>
              El <strong>Centro de Investigaciones y Transferencia de Formosa (CIT Formosa)</strong> es
              una institución científica y tecnológica de triple dependencia conformada por el{" "}
              <strong>CONICET</strong>, la <strong>Universidad Nacional de Formosa (UNaF)</strong> y el{" "}
              <strong>Gobierno de la Provincia de Formosa</strong>, creada en 2013 dentro del ámbito del
              CONICET Nordeste.
            </p>
            <div>
              <h3 className="font-semibold text-[#3fb950]">
                ¿A qué se dedica y qué actividades desarrolla?
              </h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-xs text-slate-300 sm:text-sm">
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
          <div className="space-y-3 text-sm leading-relaxed text-[#e6edf3]">
            <p>
              <strong>CITio</strong> es el sistema web de gestión de servicios y transferencia del CIT
              Formosa, diseñado para conectar de forma directa a productores agropecuarios, profesionales
              veterinarios e instituciones con las capacidades técnicas del Centro.
            </p>
            <div>
              <h3 className="font-semibold text-[#3fb950]">
                Objetivo y problemas que resuelve
              </h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-xs text-slate-300 sm:text-sm">
                <li>
                  <strong>Acceso unificado al catálogo:</strong> Centraliza la oferta de ensayos,
                  condiciones de muestra y aranceles en un único catálogo transparente.
                </li>
                <li>
                  <strong>Trazabilidad de solicitudes:</strong> Permite solicitar análisis en línea y
                  conocer el avance de cada solicitud (<em>Pendiente</em>, <em>Aprobado</em>,{" "}
                  <em>Aceptada</em>, <em>Finalizada</em>).
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

      {/* 4. Ejemplos representativos de Servicios del CIT */}
      <section aria-labelledby="heading-servicios-cit" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
          <div>
            <h2 id="heading-servicios-cit" className="text-lg font-semibold text-white">
              Servicios Tecnológicos y Diagnósticos del CIT
            </h2>
            <p className="text-xs text-[#8b949e]">
              Líneas diagnósticas y ensayos de laboratorio brindados por el Centro.
            </p>
          </div>
          <Link
            to="/servicios"
            className="text-xs font-semibold text-[#3fb950] hover:underline"
          >
            Ver catálogo completo de servicios →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICIOS_INSTITUCIONALES.map((area) => (
            <Card key={area.categoria}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{area.categoria}</h3>
                <Badge variant="neutral">Laboratorio CIT</Badge>
              </div>
              <p className="mt-1 text-xs text-[#8b949e]">{area.descripcion}</p>
              <ul className="mt-3 space-y-1.5 border-t border-[#30363d] pt-3 text-xs text-slate-200">
                {area.ensayos.map((ensayo) => (
                  <li key={ensayo} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#3fb950]" aria-hidden="true">
                      •
                    </span>
                    <span>{ensayo}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Capacitaciones, Formación y Actividades de Divulgación */}
      <section aria-labelledby="heading-capacitaciones" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
          <div>
            <h2 id="heading-capacitaciones" className="text-lg font-semibold text-white">
              Capacitaciones, Formación y Actividades
            </h2>
            <p className="text-xs text-[#8b949e]">
              Acciones de formación científica, extensión y divulgación técnica del CIT Formosa.
            </p>
          </div>
          <Link
            to="/publicaciones"
            className="text-xs font-semibold text-[#3fb950] hover:underline"
          >
            Explorar publicaciones técnicas →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CAPACITACIONES_Y_ACTIVIDADES.map((item) => (
            <Card key={item.titulo}>
              <Badge variant="success">{item.subtitulo}</Badge>
              <h3 className="mt-2.5 text-sm font-semibold text-white">
                {item.titulo}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {item.detalle}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
