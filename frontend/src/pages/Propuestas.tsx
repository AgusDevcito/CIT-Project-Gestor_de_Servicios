import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
   badgeVariantPorEstado,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type { Propuesta, Sector } from "../domain/entidades";
import { esPersonalCIT, ROL } from "../domain/roles";
import { formatearFecha, obtenerNombreVisible } from "../lib/formatters";
import {
  getSectores,
  SECTORES_OFICIALES_CIT,
} from "../services/catalogosService";
import {
  crearPropuesta,
  deletePropuesta,
  getPropuestas,
} from "../services/propuestasService";

interface FormularioPropuesta {
  nombre_organismo: string;
  email_contacto: string;
  telefono_contacto: string;
  titulo: string;
  sector: string;
  problematica: string;
  bienes_recursos: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = [".pdf", ".png", ".jpg", ".jpeg"];
const MIMES_PERMITIDOS = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{6,30}$/;

const etiquetaEstadoPropuesta = (propuesta: Propuesta): string => {
  const codigo = (propuesta.Estado?.codigo ?? "PENDIENTE").toUpperCase();
  if (codigo === "PENDIENTE") return "Pendiente";
  if (codigo === "EN_REVISION") return "En revisión";
  if (codigo === "ACEPTADA" || codigo === "APROBADO") return "Aceptada";
  if (codigo === "RECHAZADO") return "Rechazada";
  return propuesta.Estado?.nombre ?? codigo;
};

export default function Propuestas() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);
  const esUsuarioExterno = user?.rol === ROL.USER;

  const [sectores, setSectores] = useState<Sector[]>(SECTORES_OFICIALES_CIT);
  const [misPropuestas, setMisPropuestas] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // Control de apertura del formulario ("Realizar propuesta")
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState<FormularioPropuesta>({
    nombre_organismo: "",
    email_contacto: user?.email ?? "",
    telefono_contacto: "",
    titulo: "",
    sector: "",
    problematica: "",
    bienes_recursos: "",
  });
  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const sectoresPromise = getSectores().catch(() => SECTORES_OFICIALES_CIT);

    try {
      const [sectoresData, propuestasData] = await Promise.all([
        sectoresPromise,
        getPropuestas(),
      ]);
      setSectores(
        sectoresData.length > 0 ? sectoresData : SECTORES_OFICIALES_CIT,
      );
      setMisPropuestas(propuestasData);
    } catch (err) {
      const sectoresFallback = await sectoresPromise;
      setSectores(
        sectoresFallback.length > 0 ? sectoresFallback : SECTORES_OFICIALES_CIT,
      );
      setError(getApiError(err, "No se pudieron cargar las propuestas."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const abrirFormularioPropuesta = () => {
    setError("");
    setFeedback("");
    setForm((prev) => ({
      ...prev,
      email_contacto: prev.email_contacto || user?.email || "",
      sector: prev.sector || sectores[0]?.codigo || "",
    }));
    setMostrarFormulario(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = e.target.files;
    if (!files || files.length === 0) {
      setArchivoAdjunto(null);
      return;
    }

    if (files.length > 1) {
      setError("Solo se permite adjuntar un archivo de documentación por propuesta.");
      e.target.value = "";
      setArchivoAdjunto(null);
      return;
    }

    const file = files[0]!;
    const nombreLower = file.name.toLowerCase();
    const extensionValida = EXTENSIONES_PERMITIDAS.some((ext) =>
      nombreLower.endsWith(ext),
    );
    const mimeValido = !file.type || MIMES_PERMITIDOS.includes(file.type);

    if (!extensionValida || !mimeValido) {
      setError(
        "Formato de archivo no válido. Solo se permiten documentos PDF o imágenes PNG/JPG.",
      );
      e.target.value = "";
      setArchivoAdjunto(null);
      return;
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        "El archivo adjunto no puede estar vacío ni superar el tamaño máximo de 5 MB.",
      );
      e.target.value = "";
      setArchivoAdjunto(null);
      return;
    }

    setArchivoAdjunto(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!esUsuarioExterno || saving) return;

    setError("");
    setFeedback("");

    const nombreOrganismo = form.nombre_organismo.trim();
    const emailContacto = form.email_contacto.trim();
    const telefonoContacto = form.telefono_contacto.trim();
    const titulo = form.titulo.trim();
    const sector = form.sector.trim();
    const problematica = form.problematica.trim();
    const bienesRecursos = form.bienes_recursos.trim();

    if (
      !nombreOrganismo ||
      !emailContacto ||
      !telefonoContacto ||
      !titulo ||
      !sector ||
      !problematica ||
      !bienesRecursos
    ) {
      setError(
        "Todos los datos del organismo, de la propuesta y de los bienes o recursos son obligatorios.",
      );
      return;
    }

    if (!EMAIL_REGEX.test(emailContacto)) {
      setError("Ingresá un correo electrónico de contacto válido.");
      return;
    }

    if (!TELEFONO_REGEX.test(telefonoContacto)) {
      setError(
        "Ingresá un número de teléfono o WhatsApp válido (entre 6 y 30 caracteres).",
      );
      return;
    }

    if (problematica.length < 20) {
      setError(
        "La información detallada sobre utilidad y funciones debe tener al menos 20 caracteres.",
      );
      return;
    }

    // Evitar envíos duplicados accidentales en cliente
    const duplicadaEnCurso = misPropuestas.some((prop) => {
      const mismoTitulo = prop.titulo.trim().toLowerCase() === titulo.toLowerCase();
      const codigoEstado = (prop.Estado?.codigo ?? "PENDIENTE").toUpperCase();
      return (
        mismoTitulo &&
        (codigoEstado === "PENDIENTE" || codigoEstado === "EN_REVISION")
      );
    });

    if (duplicadaEnCurso) {
      setError(
        "Ya presentaste una propuesta activa con este mismo nombre que se encuentra en evaluación.",
      );
      return;
    }

    setSaving(true);
    try {
      const respuesta = await crearPropuesta({
        nombre_organismo: nombreOrganismo,
        email_contacto: emailContacto,
        telefono_contacto: telefonoContacto,
        titulo,
        sector,
        problematica,
        bienes_recursos: bienesRecursos,
        documentoFile: archivoAdjunto,
      });

      setForm({
        nombre_organismo: "",
        email_contacto: user?.email ?? "",
        telefono_contacto: "",
        titulo: "",
        sector: sectores[0]?.codigo ?? "",
        problematica: "",
        bienes_recursos: "",
      });
      setArchivoAdjunto(null);
      setMostrarFormulario(false);
      setFeedback(
        respuesta.msg ||
          "Tu propuesta fue recibida correctamente y quedó registrada en estado Pendiente para evaluación del CIT.",
      );

      if (respuesta.data) {
        setMisPropuestas((prev) => [
          respuesta.data!,
          ...prev.filter((item) => item.id !== respuesta.data!.id),
        ]);
      } else {
        await cargarDatos();
      }
    } catch (err) {
      setError(getApiError(err, "No se pudo registrar la propuesta."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePropuesta = async (propuesta: Propuesta) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar la propuesta "${propuesta.titulo}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingId(propuesta.id);
    try {
      await deletePropuesta(propuesta.id);
      setMisPropuestas((prev) => prev.filter((p) => p.id !== propuesta.id));
      setFeedback(`La propuesta "${propuesta.titulo}" fue eliminada exitosamente.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la propuesta."));
    } finally {
      setDeletingId(null);
    }
  };

  // Protección adicional si no hay sesión iniciada
  if (!user) {
    return (
      <Card className="space-y-4">
        <h1 className="text-xl font-bold text-[#e6edf3]">
          Acceso exclusivo para usuarios registrados
        </h1>
        <p className="text-sm text-[#8b949e]">
          Para presentar propuestas de servicios o iniciativas en nombre de tu organización, debés iniciar sesión en CITio.
        </p>
        <div>
          <Link
            to="/login"
            className="inline-flex items-center rounded-md bg-[#238636] px-4 py-2 text-sm font-medium text-white hover:bg-[#2ea043]"
          >
            Iniciar sesión
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propuestas de Organizaciones y Vinculación"
        subtitle="Espacio para que organizaciones productivas, especialmente organizaciones agricultoras, presenten iniciativas o servicios para evaluación del CIT."
        actions={
          esUsuarioExterno ? (
            <Button
              variant={mostrarFormulario ? "secondary" : "primary"}
              onClick={() =>
                mostrarFormulario
                  ? setMostrarFormulario(false)
                  : abrirFormularioPropuesta()
              }
            >
              {mostrarFormulario ? "Cerrar formulario" : "Realizar propuesta"}
            </Button>
          ) : isCIT ? (
            <Link
              to="/solicitudes"
              className="inline-flex items-center rounded-md bg-[#238636] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
            >
              Ir a Solicitudes (Evaluación CIT)
            </Link>
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

      {/* Bloque institucional explicativo */}
      <Card className="border-[#238636]/40 bg-gradient-to-br from-[#161b22] to-[#0d2e0f]/25">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Badge variant="success">Convocatoria Permanente · Vinculación CIT</Badge>
            <h2 className="text-xl font-semibold text-[#e6edf3]">
              Convocatoria para organizaciones agricultoras, cooperativas e instituciones
            </h2>
            <p className="text-sm leading-relaxed text-[#e6edf3]/90">
              Las organizaciones productivas de la región —<strong>especialmente las organizaciones agricultoras, asociaciones de productores, cooperativas agropecuarias y organismos técnicos</strong>— pueden presentar propuestas para ofrecer sus servicios, ensayos colaborativos o iniciativas tecnológicas a través de CITio.
            </p>
            <p className="text-xs leading-relaxed text-[#8b949e]">
              Cada propuesta recibida ingresa a la bandeja interna de <strong>Solicitudes</strong> del personal del CIT Formosa, donde se analiza su viabilidad técnica, equipamiento disponible y aporte al sector productivo. Si la propuesta es aceptada, se incorpora de manera directa al catálogo oficial de <strong>Servicios</strong>.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3fb950]">
                Etapas del proceso
              </p>
              <ol className="space-y-1.5 text-xs text-[#8b949e]">
                <li>
                  <strong className="text-[#e6edf3]">1. Presentación:</strong> Carga de datos del organismo, recursos y documentación.
                </li>
                <li>
                  <strong className="text-[#e6edf3]">2. En revisión:</strong> Evaluación técnica por especialistas del CIT.
                </li>
                <li>
                  <strong className="text-[#e6edf3]">3. Dictamen y Alta:</strong> Aceptación e incorporación automática al catálogo de Servicios.
                </li>
              </ol>
            </div>

            {esUsuarioExterno && !mostrarFormulario && (
              <div className="mt-4 pt-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={abrirFormularioPropuesta}
                >
                  Realizar propuesta
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Aviso de restricción de rol para personal CIT y Admin */}
      {isCIT && (
        <Alert variant="info" title="Vista informativa para personal CIT y Administradores">
          El formulario de presentación de propuestas está reservado exclusivamente para usuarios externos registrados (<code>user</code>) que representan a otros organismos. Para revisar, tomar en evaluación, aceptar o rechazar las propuestas recibidas, utilizá el apartado interno de{" "}
          <Link to="/solicitudes" className="font-semibold underline">
            Solicitudes
          </Link>
          .
        </Alert>
      )}

      {/* Formulario de presentación de propuesta (exclusivo rol user) */}
      {esUsuarioExterno && mostrarFormulario && (
        <Card className="border-[#2ea043]/60">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="border-b border-[#30363d] pb-3">
              <h2 className="text-lg font-semibold text-[#e6edf3]">
                Formulario de presentación de propuesta
              </h2>
              <p className="text-xs text-[#8b949e]">
                Completá los datos de tu organización, el detalle técnico de la iniciativa y adjuntá la documentación respaldatoria.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 1. Nombre del organismo */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-organismo"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  1. Nombre del organismo u organización *
                </label>
                <input
                  id="prop-organismo"
                  name="nombre_organismo"
                  required
                  maxLength={150}
                  placeholder="Ej.: Cooperativa de Productores Agrícolas de Formosa"
                  value={form.nombre_organismo}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 2. Correo electrónico */}
              <div>
                <label
                  htmlFor="prop-email"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  2. Correo electrónico de contacto *
                </label>
                <input
                  id="prop-email"
                  name="email_contacto"
                  type="email"
                  required
                  maxLength={150}
                  placeholder="contacto@organizacion.org.ar"
                  value={form.email_contacto}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 3. Número de teléfono */}
              <div>
                <label
                  htmlFor="prop-telefono"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  3. Número de teléfono o WhatsApp *
                </label>
                <input
                  id="prop-telefono"
                  name="telefono_contacto"
                  type="tel"
                  required
                  maxLength={30}
                  placeholder="+54 370 4123456"
                  value={form.telefono_contacto}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 4. Nombre de la propuesta */}
              <div>
                <label
                  htmlFor="prop-titulo"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  4. Nombre de la propuesta *
                </label>
                <input
                  id="prop-titulo"
                  name="titulo"
                  required
                  maxLength={120}
                  placeholder="Ej.: Servicio de Monitoreo de Suelos y Semillas"
                  value={form.titulo}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 5. Área a la que está orientada */}
              <div>
                <label
                  htmlFor="prop-sector"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  5. Área a la que está orientada *
                </label>
                <select
                  id="prop-sector"
                  name="sector"
                  required
                  value={form.sector}
                  onChange={handleChange}
                  className="input-base"
                >
                  <option value="">Seleccionar área…</option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.codigo}>
                      {sector.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Información detallada sobre utilidad y funciones */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-problematica"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  6. Información detallada sobre su utilidad y funciones * (mín. 20 caracteres)
                </label>
                <textarea
                  id="prop-problematica"
                  name="problematica"
                  required
                  minLength={20}
                  rows={4}
                  placeholder="Describí en detalle en qué consiste la propuesta, qué funciones cumple y cuál es su utilidad para productores o instituciones…"
                  value={form.problematica}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 7. Bienes o recursos que propone */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-bienes"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  7. Bienes, equipamiento o recursos que propone *
                </label>
                <textarea
                  id="prop-bienes"
                  name="bienes_recursos"
                  required
                  rows={3}
                  placeholder="Detallá los equipos, insumos, instalaciones o personal técnico que la organización aporta para llevar adelante el servicio…"
                  value={form.bienes_recursos}
                  onChange={handleChange}
                  className="input-base"
                />
              </div>

              {/* 8. Archivos adjuntos para documentación */}
              <div className="sm:col-span-2 rounded-xl border border-[#30363d] bg-[#0d1117] p-4">
                <label
                  htmlFor="prop-documento"
                  className="mb-1.5 block text-xs font-medium text-[#e6edf3]"
                >
                  8. Archivos adjuntos para documentación (PDF, PNG o JPG — máx. 5 MB)
                </label>
                <input
                  id="prop-documento"
                  name="documento"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={handleArchivoChange}
                  className="block w-full text-xs text-[#8b949e] file:mr-4 file:rounded-md file:border-0 file:bg-[#21262d] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#e6edf3] hover:file:bg-[#30363d]"
                />
                <p className="mt-1.5 text-xs text-[#8b949e]">
                  {archivoAdjunto
                    ? `Archivo seleccionado: ${archivoAdjunto.name} (${(
                        archivoAdjunto.size / 1024
                      ).toFixed(1)} KB)`
                    : "Podés adjuntar avales institucionales, memoria técnica o especificaciones del equipamiento (máximo 1 archivo de hasta 5 MB)."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                Enviar propuesta
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Listado de seguimiento de propuestas enviadas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#e6edf3]">
              {esUsuarioExterno
                ? "Mis propuestas presentadas"
                : "Propuestas registradas por organizaciones"}
            </h2>
            <p className="text-xs text-[#8b949e]">
              {esUsuarioExterno
                ? "Seguimiento en tiempo real del estado de evaluación y dictamen del CIT."
                : "Vista general de propuestas registradas en el sistema."}
            </p>
          </div>
          <Badge variant="neutral">{misPropuestas.length} registradas</Badge>
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : misPropuestas.length === 0 ? (
          <EmptyState
            title="Aún no registraste propuestas"
            description="Seleccioná el botón Realizar propuesta para presentar una iniciativa de tu organismo ante el CIT Formosa."
            action={
              esUsuarioExterno ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={abrirFormularioPropuesta}
                >
                  Realizar propuesta
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4">
            {misPropuestas.map((propuesta) => {
              const codigoEstado = (
                propuesta.Estado?.codigo ?? "PENDIENTE"
              ).toUpperCase();
              const revisorNombre = propuesta.Revisor
                ? obtenerNombreVisible({
                    nombre: propuesta.Revisor.Profile?.first_name,
                    apellido: propuesta.Revisor.Profile?.last_name,
                    username: propuesta.Revisor.username,
                  })
                : null;

              return (
                <Card key={propuesta.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">
                          {propuesta.Sector?.nombre || "Sin área"}
                        </Badge>
                        {propuesta.nombre_organismo && (
                          <span className="text-xs font-medium text-[#e6edf3]">
                            {propuesta.nombre_organismo}
                          </span>
                        )}
                        <span className="text-xs text-[#8b949e]">
                          · Presentada el {formatearFecha(propuesta.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#e6edf3]">
                        {propuesta.titulo}
                      </h3>
                    </div>

                    <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                      {etiquetaEstadoPropuesta(propuesta)}
                    </Badge>
                  </div>

                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#8b949e]">
                    {propuesta.problematica}
                  </p>

                  {(propuesta.bienes_recursos ||
                    propuesta.email_contacto ||
                    propuesta.telefono_contacto ||
                    propuesta.documento_url) && (
                    <div className="grid gap-3 rounded-lg border border-[#21262d] bg-[#0d1117]/70 p-3 text-xs text-[#8b949e] sm:grid-cols-2">
                      {propuesta.bienes_recursos && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-[#e6edf3]">
                            Bienes o recursos propuestos:{" "}
                          </span>
                          {propuesta.bienes_recursos}
                        </div>
                      )}
                      {propuesta.email_contacto && (
                        <div>
                          <span className="font-semibold text-[#e6edf3]">
                            Correo:{" "}
                          </span>
                          {propuesta.email_contacto}
                        </div>
                      )}
                      {propuesta.telefono_contacto && (
                        <div>
                          <span className="font-semibold text-[#e6edf3]">
                            Teléfono:{" "}
                          </span>
                          {propuesta.telefono_contacto}
                        </div>
                      )}
                      {propuesta.documento_url && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-[#e6edf3]">
                            Documentación adjunta:{" "}
                          </span>
                          <a
                            href={propuesta.documento_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#58a6ff] hover:underline"
                          >
                            {propuesta.documento_nombre || "Ver documento adjunto"}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dictamen y trazabilidad con el Servicio generado (Fase D <-> Fase F) */}
                  {(propuesta.citJustificacion ||
                    propuesta.servicio_generado_id ||
                    codigoEstado === "EN_REVISION") && (
                    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#e6edf3]">
                          {codigoEstado === "EN_REVISION"
                            ? "Estado de revisión CIT"
                            : "Dictamen técnico del CIT"}
                        </p>
                        {propuesta.citFechaRevision && (
                          <span className="text-[#8b949e]">
                            {formatearFecha(propuesta.citFechaRevision)}
                            {revisorNombre ? ` · Evaluador: ${revisorNombre}` : ""}
                          </span>
                        )}
                      </div>

                      {propuesta.citJustificacion ? (
                        <p className="mt-1.5 text-[#8b949e]">
                          {propuesta.citJustificacion}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[#8b949e]">
                          Tu propuesta fue tomada para evaluación por el equipo técnico del CIT.
                        </p>
                      )}

                      {propuesta.servicio_generado_id && (
                        <div className="mt-3 flex items-center justify-between rounded-md border border-[#238636]/50 bg-[#238636]/15 px-3 py-2 text-[#3fb950]">
                          <span>
                            Esta propuesta fue aceptada e incorporada al catálogo de Servicios.
                          </span>
                          <Link
                            to={`/servicios/${propuesta.servicio_generado_id}`}
                            className="font-semibold underline hover:text-white"
                          >
                            Ver servicio publicado →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end border-t border-[#30363d] pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === propuesta.id}
                      onClick={() => void handleDeletePropuesta(propuesta)}
                      aria-label={`Eliminar propuesta ${propuesta.titulo}`}
                    >
                      Eliminar propuesta
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
