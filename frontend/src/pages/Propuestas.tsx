import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  Card,
  PageHeader,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type { Propuesta, Sector } from "../domain/entidades";
import { esPersonalCIT, ROL } from "../domain/roles";
import {
  getSectores,
  SECTORES_OFICIALES_CIT,
} from "../services/catalogosService";
import {
  crearPropuesta,
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
  en_representacion: boolean;
  beneficiario_nombre: string;
  beneficiario_dni_cuit: string;
  beneficiario_localidad: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = [".pdf", ".png", ".jpg", ".jpeg"];
const MIMES_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{6,30}$/;

export default function Propuestas() {
  const { user } = useAuth();
  const isCIT = esPersonalCIT(user?.rol);
  const esUsuarioExterno = user?.rol === ROL.USER;

  const [sectores, setSectores] = useState<Sector[]>(SECTORES_OFICIALES_CIT);
  const [misPropuestas, setMisPropuestas] = useState<Propuesta[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  // En el nuevo apartado "Proponer", el formulario está visible directamente para el productor/organización
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [form, setForm] = useState<FormularioPropuesta>({
    nombre_organismo: "",
    email_contacto: user?.email ?? "",
    telefono_contacto: "",
    titulo: "",
    sector: SECTORES_OFICIALES_CIT[0]?.codigo ?? "",
    problematica: "",
    bienes_recursos: "",
    en_representacion: false,
    beneficiario_nombre: "",
    beneficiario_dni_cuit: "",
    beneficiario_localidad: "",
  });
  const [archivoAdjunto, setArchivoAdjunto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!user) return;

    const sectoresPromise = getSectores().catch(() => SECTORES_OFICIALES_CIT);

    try {
      const [sectoresData, propuestasData] = await Promise.all([
        sectoresPromise,
        getPropuestas(),
      ]);
      const listaSectores =
        sectoresData.length > 0 ? sectoresData : SECTORES_OFICIALES_CIT;
      setSectores(listaSectores);
      setMisPropuestas(propuestasData);
      setForm((prev) => ({
        ...prev,
        email_contacto: prev.email_contacto || user.email || "",
        sector: prev.sector || listaSectores[0]?.codigo || "",
      }));
    } catch (err) {
      const sectoresFallback = await sectoresPromise;
      setSectores(
        sectoresFallback.length > 0 ? sectoresFallback : SECTORES_OFICIALES_CIT,
      );
      setError(getApiError(err, "No se pudieron cargar los datos iniciales."));
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
      setError(
        "Solo se permite adjuntar un archivo de documentación por propuesta.",
      );
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

    const duplicadaEnCurso = misPropuestas.some((prop) => {
      const mismoTitulo =
        prop.titulo.trim().toLowerCase() === titulo.toLowerCase();
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
        ...(form.en_representacion && form.beneficiario_nombre.trim()
          ? {
              beneficiario_nombre: form.beneficiario_nombre.trim(),
              beneficiario_dni_cuit: form.beneficiario_dni_cuit.trim(),
              beneficiario_localidad: form.beneficiario_localidad.trim(),
            }
          : {}),
      });

      setForm({
        nombre_organismo: "",
        email_contacto: user?.email ?? "",
        telefono_contacto: "",
        titulo: "",
        sector: sectores[0]?.codigo ?? "",
        problematica: "",
        bienes_recursos: "",
        en_representacion: false,
        beneficiario_nombre: "",
        beneficiario_dni_cuit: "",
        beneficiario_localidad: "",
      });
      setArchivoAdjunto(null);
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

  if (!user) {
    return (
      <Card className="space-y-4">
        <h1 className="text-xl font-bold text-gh-text">
          Acceso exclusivo para usuarios registrados
        </h1>
        <p className="text-sm text-gh-muted">
          Para presentar propuestas de servicios o iniciativas en nombre de tu organización, debés iniciar sesión en CITio.
        </p>
        <div>
          <LinkButton to="/login">
            Iniciar sesión
          </LinkButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proponer Iniciativa o Servicio al CIT"
        subtitle="Espacio para que productores y organizaciones productivas presenten problemáticas, ensayos o iniciativas para evaluación técnica del CIT Formosa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {esUsuarioExterno ? (
              <>
                <LinkButton to="/ajustes/propuestas" variant="secondary">
                  Ver tus propuestas ({misPropuestas.length})
                </LinkButton>
                {!mostrarFormulario && (
                  <Button variant="primary" onClick={abrirFormularioPropuesta}>
                    Realizar propuesta
                  </Button>
                )}
              </>
            ) : isCIT ? (
              <LinkButton to="/solicitudes">
                Ir a Solicitudes (Evaluación CIT)
              </LinkButton>
            ) : undefined}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{feedback}</span>
            <Link
              to="/ajustes/propuestas"
              className="font-semibold underline hover:text-white"
            >
              Ver tus propuestas en Ajustes →
            </Link>
          </div>
        </Alert>
      )}

      {/* Bloque institucional explicativo */}
      <Card className="border-cit-accent/40 bg-gradient-to-br from-gh-surface to-cit-forest/25">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Badge variant="success">Convocatoria Permanente · Vinculación CIT</Badge>
            <h2 className="text-xl font-semibold text-gh-text">
              Convocatoria para organizaciones agricultoras, cooperativas e instituciones
            </h2>
            <p className="text-sm leading-relaxed text-gh-text/90">
              Las organizaciones productivas de la región —<strong>especialmente las organizaciones agricultoras, asociaciones de productores, cooperativas agropecuarias y organismos técnicos</strong>— pueden presentar propuestas para ofrecer sus servicios, ensayos colaborativos o iniciativas tecnológicas a través de CITio.
            </p>
            <p className="text-xs leading-relaxed text-gh-muted">
              Cada propuesta recibida ingresa a la bandeja interna de <strong>Solicitudes</strong> del personal del CIT Formosa, donde se analiza su viabilidad técnica, equipamiento disponible y aporte al sector productivo. Si la propuesta es aceptada, se incorpora de manera directa al catálogo oficial de <strong>Servicios</strong>.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-gh-border bg-gh-canvas/80 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-cit-accent-emphasis">
                Etapas del proceso
              </p>
              <ol className="space-y-1.5 text-xs text-gh-muted">
                <li>
                  <strong className="text-gh-text">1. Presentación:</strong> Carga de datos del organismo, recursos y documentación.
                </li>
                <li>
                  <strong className="text-gh-text">2. En revisión:</strong> Evaluación técnica por especialistas del CIT.
                </li>
                <li>
                  <strong className="text-gh-text">3. Dictamen y Alta:</strong> Aceptación e incorporación automática al catálogo de Servicios.
                </li>
              </ol>
            </div>

            {esUsuarioExterno && (
              <div className="mt-4 space-y-2 pt-2">
                <Link
                  to="/ajustes/propuestas"
                  className="inline-flex w-full items-center justify-center rounded-md border border-cit-forest-border/60 bg-cit-forest-raised px-3 py-2 text-xs font-semibold text-cit-accent-emphasis transition-colors hover:bg-cit-forest-hover hover:text-white"
                >
                  Ver tus propuestas ({misPropuestas.length})
                </Link>
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
        <Card className="border-cit-accent-hover/60">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-border pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gh-text">
                  Formulario de presentación de propuesta
                </h2>
                <p className="text-xs text-gh-muted">
                  Completá los datos de tu organización, el detalle técnico de la iniciativa y adjuntá la documentación respaldatoria.
                </p>
              </div>
              <Link
                to="/ajustes/propuestas"
                className="text-xs font-semibold text-status-info hover:underline"
              >
                Ver tus propuestas enviadas →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-organismo"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div>
                <label
                  htmlFor="prop-email"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div>
                <label
                  htmlFor="prop-telefono"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div>
                <label
                  htmlFor="prop-titulo"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div>
                <label
                  htmlFor="prop-sector"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-problematica"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div className="sm:col-span-2">
                <label
                  htmlFor="prop-bienes"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
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

              <div className="sm:col-span-2 rounded-xl border border-gh-border bg-gh-canvas p-4">
                <label
                  htmlFor="prop-documento"
                  className="mb-1.5 block text-xs font-medium text-gh-text"
                >
                  8. Archivos adjuntos para documentación (PDF, PNG o JPG — máx. 5 MB)
                </label>
                <input
                  id="prop-documento"
                  name="documento"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={handleArchivoChange}
                  className="block w-full text-xs text-gh-muted file:mr-4 file:rounded-md file:border-0 file:bg-gh-elevated file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gh-text hover:file:bg-gh-border"
                />
                <p className="mt-1.5 text-xs text-gh-muted">
                  {archivoAdjunto
                    ? `Archivo seleccionado: ${archivoAdjunto.name} (${(
                        archivoAdjunto.size / 1024
                      ).toFixed(1)} KB)`
                    : "Podés adjuntar avales institucionales, memoria técnica o especificaciones del equipamiento (máximo 1 archivo de hasta 5 MB)."}
                </p>
              </div>

              {/* 9. Intermediación de Entidad / Cooperativa (Nivel 4) */}
              <div className="sm:col-span-2 rounded-xl border border-gh-border bg-gh-canvas/80 p-4 space-y-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-gh-text">
                  <input
                    type="checkbox"
                    checked={form.en_representacion}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        en_representacion: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                  />
                  <span>
                    Presentar esta propuesta en representación de un productor asociado (Entidad / Cooperativa)
                  </span>
                </label>

                {form.en_representacion && (
                  <div className="grid gap-3 pt-1 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="prop-beneficiario-nombre"
                        className="mb-1 block text-xs text-gh-muted"
                      >
                        Nombre del productor representado *
                      </label>
                      <input
                        id="prop-beneficiario-nombre"
                        name="beneficiario_nombre"
                        placeholder="Ej.: Juan Carlos Medina"
                        value={form.beneficiario_nombre}
                        onChange={handleChange}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prop-beneficiario-dni"
                        className="mb-1 block text-xs text-gh-muted"
                      >
                        DNI o CUIT del productor
                      </label>
                      <input
                        id="prop-beneficiario-dni"
                        name="beneficiario_dni_cuit"
                        placeholder="20-18234567-3"
                        value={form.beneficiario_dni_cuit}
                        onChange={handleChange}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prop-beneficiario-localidad"
                        className="mb-1 block text-xs text-gh-muted"
                      >
                        Localidad / Paraje del productor
                      </label>
                      <input
                        id="prop-beneficiario-localidad"
                        name="beneficiario_localidad"
                        placeholder="Ej.: Ingeniero Juárez"
                        value={form.beneficiario_localidad}
                        onChange={handleChange}
                        className="input-base"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <LinkButton to="/ajustes/propuestas" variant="secondary">
                Ver tus propuestas
              </LinkButton>
              <div className="flex items-center gap-2">
                <Button type="submit" loading={saving}>
                  Enviar propuesta
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
