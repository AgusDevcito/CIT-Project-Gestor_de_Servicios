import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Badge,
  badgeVariantPorEstado,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
  StatusTimeline,
  buildPropuestaTimelineSteps,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type {
  PreferenciasNotificacion,
  Propuesta,
  TipoPerfil,
} from "../domain/entidades";
import { labelDeRol } from "../domain/roles";
import { formatearFecha, obtenerNombreVisible } from "../lib/formatters";
import {
  getPreferenciasNotificacion,
  PREFERENCIAS_NOTIFICACION_DEFAULT,
  updatePreferenciasNotificacion,
} from "../services/notificacionesService";
import {
  changePassword,
  deleteOwnAccount,
  getProfileByUserId,
  updateProfile,
} from "../services/profileService";
import {
  cancelarPropuesta,
  deletePropuesta,
  getPropuestas,
} from "../services/propuestasService";

type SeccionAjustes = "propuestas" | "perfil" | "notificaciones" | "mi-cuenta";

interface FormularioAjustesPerfil {
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
  tipo_perfil: TipoPerfil;
  razon_social: string;
  cuit: string;
  localidad: string;
  telefono_whatsapp: string;
}

interface FormularioPassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INITIAL_PASSWORD_FORM: FormularioPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SECCIONES_AJUSTES: readonly {
  id: SeccionAjustes;
  label: string;
  descripcion: string;
}[] = [
  {
    id: "propuestas",
    label: "Propuestas",
    descripcion: "Listado, detalles, revisión del CIT y cancelación de tus propuestas.",
  },
  {
    id: "perfil",
    label: "Perfil",
    descripcion: "Información personal, avatar, contraseña y perfil de Entidad / Cooperativa.",
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    descripcion: "Preferencias de avisos y alertas de la plataforma.",
  },
  {
    id: "mi-cuenta",
    label: "Mi Cuenta",
    descripcion: "Seguridad y opción de eliminar cuenta en CITio.",
  },
];

const etiquetaEstadoPropuesta = (propuesta: Propuesta): string => {
  const codigo = (propuesta.Estado?.codigo ?? "PENDIENTE").toUpperCase();
  if (codigo === "PENDIENTE") return "Pendiente";
  if (codigo === "EN_REVISION") return "En revisión";
  if (codigo === "ACEPTADA" || codigo === "APROBADO") return "Aceptada";
  if (codigo === "RECHAZADO" || codigo === "RECHAZADA") return "Rechazada";
  if (codigo === "CANCELADA" || codigo === "CANCELADO") return "Cancelada";
  return propuesta.Estado?.nombre ?? codigo;
};

export default function Ajustes() {
  const { user, refresh, logout } = useAuth();
  const { seccion } = useParams<{ seccion?: string }>();
  const navigate = useNavigate();

  const seccionActiva: SeccionAjustes =
    seccion === "perfil" ||
    seccion === "notificaciones" ||
    seccion === "mi-cuenta" ||
    seccion === "propuestas"
      ? seccion
      : "propuestas";

  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [propuestaSeleccionada, setPropuestaSeleccionada] =
    useState<Propuesta | null>(null);

  // Estado de Ajustes -> Perfil (Información personal, Entidad/Cooperativa y Contraseña)
  const [perfilForm, setPerfilForm] = useState<FormularioAjustesPerfil>({
    first_name: user?.nombre ?? "",
    last_name: user?.apellido ?? "",
    avatar_url: user?.avatarUrl ?? "",
    bio: "",
    tipo_perfil: "PRODUCTOR",
    razon_social: "",
    cuit: "",
    localidad: "",
    telefono_whatsapp: "",
  });
  const [passwordForm, setPasswordForm] = useState<FormularioPassword>(
    INITIAL_PASSWORD_FORM,
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Estado de Ajustes -> Mi Cuenta (Eliminar cuenta)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Estado de Ajustes -> Notificaciones (Preferencias y WhatsApp)
  const [preferenciasNotif, setPreferenciasNotif] =
    useState<PreferenciasNotificacion>(PREFERENCIAS_NOTIFICACION_DEFAULT);
  const [savingPreferencias, setSavingPreferencias] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [propuestasData, perfilRemoto, prefsRemotas] = await Promise.all([
        Promise.resolve(getPropuestas()),
        Promise.resolve(getProfileByUserId(user.id)).catch(() => null),
        Promise.resolve(getPreferenciasNotificacion()).catch(() => null),
      ]);
      setPropuestas(propuestasData ?? []);
      if (prefsRemotas) {
        setPreferenciasNotif(prefsRemotas);
      }
      if (perfilRemoto) {
        setPerfilForm({
          first_name: perfilRemoto.first_name ?? user.nombre ?? "",
          last_name: perfilRemoto.last_name ?? user.apellido ?? "",
          avatar_url: perfilRemoto.avatar_url ?? user.avatarUrl ?? "",
          bio: perfilRemoto.bio ?? "",
          tipo_perfil: perfilRemoto.tipo_perfil ?? "PRODUCTOR",
          razon_social: perfilRemoto.razon_social ?? "",
          cuit: perfilRemoto.cuit ?? "",
          localidad: perfilRemoto.localidad ?? "",
          telefono_whatsapp: perfilRemoto.telefono_whatsapp ?? "",
        });
      }
    } catch (err) {
      setError(getApiError(err, "No se pudieron cargar los datos de Ajustes."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const handleCancelarPropuesta = async (propuesta: Propuesta) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseás cancelar la propuesta "${propuesta.titulo}"?`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setCancelingId(propuesta.id);
    try {
      const res = await cancelarPropuesta(propuesta.id);
      if (res.data) {
        setPropuestas((prev) =>
          prev.map((item) => (item.id === propuesta.id ? res.data! : item)),
        );
        if (propuestaSeleccionada?.id === propuesta.id) {
          setPropuestaSeleccionada(res.data);
        }
      } else {
        await cargarDatos();
      }
      setFeedback(
        res.msg || `La propuesta "${propuesta.titulo}" fue cancelada.`,
      );
    } catch (err) {
      setError(getApiError(err, "No se pudo cancelar la propuesta."));
    } finally {
      setCancelingId(null);
    }
  };

  const handleEliminarPropuesta = async (propuesta: Propuesta) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar definitivamente la propuesta "${propuesta.titulo}"?`,
      )
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setDeletingId(propuesta.id);
    try {
      await deletePropuesta(propuesta.id);
      setPropuestas((prev) => prev.filter((item) => item.id !== propuesta.id));
      if (propuestaSeleccionada?.id === propuesta.id) {
        setPropuestaSeleccionada(null);
      }
      setFeedback(`La propuesta "${propuesta.titulo}" fue eliminada.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la propuesta."));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePerfilChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setPerfilForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setFeedback("");

    if (!perfilForm.first_name.trim() || !perfilForm.last_name.trim()) {
      setError("El nombre y el apellido son obligatorios.");
      return;
    }

    if (
      perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA" &&
      !perfilForm.razon_social.trim()
    ) {
      setError(
        "Indicá la razón social o nombre de la Entidad / Cooperativa.",
      );
      return;
    }

    setSavingProfile(true);
    try {
      const actualizado = await updateProfile(user.id, {
        first_name: perfilForm.first_name.trim(),
        last_name: perfilForm.last_name.trim(),
        avatar_url: perfilForm.avatar_url.trim(),
        bio: perfilForm.bio.trim(),
        tipo_perfil: perfilForm.tipo_perfil,
        razon_social:
          perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA"
            ? perfilForm.razon_social.trim()
            : null,
        cuit:
          perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA"
            ? perfilForm.cuit.trim()
            : null,
        localidad: perfilForm.localidad.trim() || null,
        telefono_whatsapp: perfilForm.telefono_whatsapp.trim() || null,
      });

      setPerfilForm({
        first_name: actualizado.first_name,
        last_name: actualizado.last_name,
        avatar_url: actualizado.avatar_url ?? "",
        bio: actualizado.bio ?? "",
        tipo_perfil: actualizado.tipo_perfil ?? "PRODUCTOR",
        razon_social: actualizado.razon_social ?? "",
        cuit: actualizado.cuit ?? "",
        localidad: actualizado.localidad ?? "",
        telefono_whatsapp: actualizado.telefono_whatsapp ?? "",
      });

      await refresh();
      setFeedback("Información de perfil actualizada correctamente.");
    } catch (err) {
      setError(getApiError(err, "No se pudo actualizar el perfil."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Completá todos los campos para actualizar la contraseña.");
      return;
    }

    if (
      newPassword.length < 6 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      setError(
        "La nueva contraseña debe tener al menos 6 caracteres e incluir letras y números.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordForm(INITIAL_PASSWORD_FORM);
      setFeedback(res.msg || "Contraseña actualizada correctamente.");
    } catch (err) {
      setError(getApiError(err, "No se pudo cambiar la contraseña."));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleConfirmarEliminarCuenta = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINAR") {
      setError(
        'Para confirmar la baja de tu cuenta debés escribir exactamente "ELIMINAR".',
      );
      return;
    }

    if (!deletePassword) {
      setError("Ingresá tu contraseña actual para confirmar la operación.");
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteOwnAccount({
        password: deletePassword,
        confirmacion: "ELIMINAR",
      });
      setModalEliminarAbierto(false);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        getApiError(err, "No se pudo procesar la eliminación de la cuenta."),
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSavePreferenciasNotificacion = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    setSavingPreferencias(true);
    try {
      const res = await updatePreferenciasNotificacion(preferenciasNotif);
      setPreferenciasNotif(res.data);
      setFeedback(
        res.msg ||
          "Preferencias de notificaciones actualizadas correctamente.",
      );
    } catch (err) {
      setError(
        getApiError(
          err,
          "No se pudieron guardar las preferencias de notificaciones.",
        ),
      );
    } finally {
      setSavingPreferencias(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes y Gestión Personal"
        subtitle="Administrá tus propuestas presentadas, tu perfil personal o de Entidad/Cooperativa, preferencias de notificaciones y seguridad de cuenta."
        actions={
          <LinkButton to="/proponer">
            + Nueva propuesta
          </LinkButton>
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

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Menú lateral de Ajustes */}
        <aside className="space-y-2 lg:col-span-1" aria-label="Menú de Ajustes">
          <Card className="space-y-1.5 p-2.5">
            {SECCIONES_AJUSTES.map((item) => {
              const activa = seccionActiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/ajustes/${item.id}`)}
                  aria-current={activa ? "page" : undefined}
                  className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activa
                      ? "bg-cit-accent text-white"
                      : "text-gh-text hover:bg-gh-surface"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span
                    className={`mt-0.5 text-xs leading-snug ${
                      activa ? "text-white/85" : "text-gh-muted"
                    }`}
                  >
                    {item.descripcion}
                  </span>
                </button>
              );
            })}
          </Card>
        </aside>

        {/* Contenido de la subsección seleccionada */}
        <div className="space-y-6 lg:col-span-3">
          {/* 1. AJUSTES / PROPUESTAS */}
          {seccionActiva === "propuestas" && (
            <section className="space-y-4" aria-label="Mis propuestas en Ajustes">
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gh-text">
                    Mis Propuestas Presentadas
                  </h2>
                  <p className="text-xs text-gh-muted">
                    Consultá el detalle, estado de revisión, dictamen técnico del CIT o cancelá propuestas pendientes.
                  </p>
                </div>
                <Badge variant="neutral">{propuestas.length} registradas</Badge>
              </Card>

              {loading ? (
                <div className="space-y-3" aria-busy="true">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-36 w-full rounded-xl" />
                </div>
              ) : propuestas.length === 0 ? (
                <EmptyState
                  title="Aún no presentaste propuestas"
                  description="Podés presentar una nueva problemática o iniciativa productiva desde el apartado Proponer."
                  action={
                    <LinkButton to="/proponer">
                      Ir a Proponer
                    </LinkButton>
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {propuestas.map((propuesta) => {
                    const codigoEstado = (
                      propuesta.Estado?.codigo ?? "PENDIENTE"
                    ).toUpperCase();
                    const puedeCancelar =
                      codigoEstado === "PENDIENTE" ||
                      codigoEstado === "EN_REVISION";
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
                                <span className="text-xs font-medium text-gh-text">
                                  {propuesta.nombre_organismo}
                                </span>
                              )}
                              {propuesta.beneficiario_nombre && (
                                <Badge variant="purple">
                                  En representación de:{" "}
                                  {propuesta.beneficiario_nombre}
                                </Badge>
                              )}
                              <span className="text-xs text-gh-muted">
                                · Presentada el{" "}
                                {formatearFecha(propuesta.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gh-text">
                              {propuesta.titulo}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                              {etiquetaEstadoPropuesta(propuesta)}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setPropuestaSeleccionada(propuesta)}
                            >
                              Ver detalles y revisión
                            </Button>
                            {puedeCancelar && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                loading={cancelingId === propuesta.id}
                                onClick={() =>
                                  void handleCancelarPropuesta(propuesta)
                                }
                              >
                                Cancelar propuesta
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              loading={deletingId === propuesta.id}
                              onClick={() =>
                                void handleEliminarPropuesta(propuesta)
                              }
                              aria-label={`Eliminar propuesta ${propuesta.titulo}`}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <p className="whitespace-pre-line text-sm leading-relaxed text-gh-muted">
                          {propuesta.problematica}
                        </p>

                        <StatusTimeline
                          ariaLabel={`Seguimiento de propuesta ${propuesta.titulo}`}
                          steps={buildPropuestaTimelineSteps(propuesta)}
                        />

                        {(propuesta.citJustificacion ||
                          propuesta.servicio_generado_id) && (
                          <div className="rounded-lg border border-gh-border bg-gh-surface p-3.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-gh-text">
                                Dictamen técnico del CIT
                              </p>
                              {propuesta.citFechaRevision && (
                                <span className="text-gh-muted">
                                  {formatearFecha(propuesta.citFechaRevision)}
                                  {revisorNombre
                                    ? ` · Evaluador: ${revisorNombre}`
                                    : ""}
                                </span>
                              )}
                            </div>
                            {propuesta.citJustificacion && (
                              <p className="mt-1.5 text-gh-muted">
                                {propuesta.citJustificacion}
                              </p>
                            )}
                            {propuesta.servicio_generado_id && (
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-cit-accent/50 bg-cit-accent/15 px-3 py-2 text-cit-accent-emphasis">
                                <span>
                                  Esta propuesta fue aprobada e incorporada al catálogo oficial de Servicios.
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
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 2. AJUSTES / PERFIL (Información personal, Avatar, Contraseña y Entidad/Cooperativa) */}
          {seccionActiva === "perfil" && (
            <section className="space-y-6" aria-label="Edición de Perfil y Contraseña">
              <Card className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-elevated pb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gh-text">
                      Editar Información Personal y Tipo de Perfil
                    </h2>
                    <p className="text-xs text-gh-muted">
                      Actualizá tus datos personales, URL del avatar, teléfono WhatsApp o configurá tu cuenta como Entidad / Cooperativa.
                    </p>
                  </div>
                  <Badge
                    variant={
                      perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA"
                        ? "purple"
                        : "info"
                    }
                  >
                    {perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA"
                      ? "Entidad / Cooperativa"
                      : "Productor Individual"}
                  </Badge>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="ajustes-tipo-perfil"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Modalidad de perfil en CITio
                      </label>
                      <select
                        id="ajustes-tipo-perfil"
                        name="tipo_perfil"
                        value={perfilForm.tipo_perfil}
                        onChange={handlePerfilChange}
                        className="input-base"
                      >
                        <option value="PRODUCTOR">
                          Productor Agropecuario / Profesional Individual
                        </option>
                        <option value="ENTIDAD_COOPERATIVA">
                          Entidad / Cooperativa / Asociación de Productores
                        </option>
                      </select>
                    </div>

                    {perfilForm.tipo_perfil === "ENTIDAD_COOPERATIVA" && (
                      <>
                        <div>
                          <label
                            htmlFor="ajustes-razon-social"
                            className="mb-1.5 block text-xs font-medium text-gh-text"
                          >
                            Razón social o nombre de la Cooperativa / Entidad *
                          </label>
                          <input
                            id="ajustes-razon-social"
                            name="razon_social"
                            required
                            placeholder="Ej.: Cooperativa Agropecuaria Río Bermejo Ltda."
                            value={perfilForm.razon_social}
                            onChange={handlePerfilChange}
                            className="input-base"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="ajustes-cuit"
                            className="mb-1.5 block text-xs font-medium text-gh-text"
                          >
                            CUIT institucional
                          </label>
                          <input
                            id="ajustes-cuit"
                            name="cuit"
                            placeholder="30-71234567-9"
                            value={perfilForm.cuit}
                            onChange={handlePerfilChange}
                            className="input-base"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label
                        htmlFor="ajustes-nombre"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Nombre *
                      </label>
                      <input
                        id="ajustes-nombre"
                        name="first_name"
                        required
                        value={perfilForm.first_name}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-apellido"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Apellido *
                      </label>
                      <input
                        id="ajustes-apellido"
                        name="last_name"
                        required
                        value={perfilForm.last_name}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-localidad"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Localidad / Departamento (Formosa)
                      </label>
                      <input
                        id="ajustes-localidad"
                        name="localidad"
                        placeholder="Ej.: Las Lomitas, Pirané, El Colorado…"
                        value={perfilForm.localidad}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-whatsapp"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Teléfono / WhatsApp (para avisos)
                      </label>
                      <input
                        id="ajustes-whatsapp"
                        name="telefono_whatsapp"
                        type="tel"
                        placeholder="+54 9 370 4123456"
                        value={perfilForm.telefono_whatsapp}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="ajustes-bio"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Información personal o descripción
                      </label>
                      <textarea
                        id="ajustes-bio"
                        name="bio"
                        rows={3}
                        maxLength={1000}
                        placeholder="Describí tu actividad productiva, establecimiento u organización…"
                        value={perfilForm.bio}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="ajustes-avatar"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        URL del avatar (opcional)
                      </label>
                      <input
                        id="ajustes-avatar"
                        name="avatar_url"
                        type="url"
                        placeholder="https://ejemplo.com/mi-avatar.png"
                        value={perfilForm.avatar_url}
                        onChange={handlePerfilChange}
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-email-readonly"
                        className="mb-1.5 block text-xs font-medium text-gh-muted"
                      >
                        Correo electrónico (no modificable)
                      </label>
                      <input
                        id="ajustes-email-readonly"
                        type="email"
                        value={user.email}
                        disabled
                        readOnly
                        className="input-base cursor-not-allowed opacity-60"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-rol-readonly"
                        className="mb-1.5 block text-xs font-medium text-gh-muted"
                      >
                        Rol en el sistema (no modificable)
                      </label>
                      <input
                        id="ajustes-rol-readonly"
                        type="text"
                        value={labelDeRol(user.rol)}
                        disabled
                        readOnly
                        className="input-base cursor-not-allowed opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" loading={savingProfile}>
                      Guardar cambios de perfil
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Cambio de Contraseña dentro de Ajustes/Perfil */}
              <Card className="space-y-4">
                <div className="border-b border-gh-elevated pb-3">
                  <h2 className="text-lg font-semibold text-gh-text">
                    Actualizar Contraseña
                  </h2>
                  <p className="text-xs text-gh-muted">
                    Por seguridad, ingresá tu contraseña actual antes de definir una nueva clave.
                  </p>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="ajustes-current-password"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Contraseña actual
                      </label>
                      <input
                        id="ajustes-current-password"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-new-password"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Nueva contraseña
                      </label>
                      <input
                        id="ajustes-new-password"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="input-base"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ajustes-confirm-password"
                        className="mb-1.5 block text-xs font-medium text-gh-text"
                      >
                        Confirmar nueva contraseña
                      </label>
                      <input
                        id="ajustes-confirm-password"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="input-base"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="secondary"
                      loading={savingPassword}
                    >
                      Actualizar contraseña
                    </Button>
                  </div>
                </form>
              </Card>
            </section>
          )}

          {/* 3. AJUSTES / NOTIFICACIONES */}
          {seccionActiva === "notificaciones" && (
            <section
              className="space-y-6"
              aria-label="Preferencias de Notificaciones y WhatsApp"
            >
              <Card className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-elevated pb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gh-text">
                      Preferencias de Notificaciones
                    </h2>
                    <p className="text-xs text-gh-muted">
                      Elegí qué avisos querés recibir en la campanilla de CITio y por WhatsApp.
                    </p>
                  </div>
                  <Link
                    to="/notificaciones"
                    className="text-xs font-semibold text-status-info hover:underline"
                  >
                    Ver Centro de Notificaciones →
                  </Link>
                </div>

                <form
                  onSubmit={handleSavePreferenciasNotificacion}
                  className="space-y-4"
                >
                  <div className="divide-y divide-gh-elevated rounded-xl border border-gh-elevated bg-gh-canvas/70">
                    <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gh-text">
                          Noticias y publicaciones técnicas
                        </p>
                        <p className="text-xs text-gh-muted">
                          Alertas sanitarias, artículos científicos y boletines del CIT Formosa.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Noticias y publicaciones técnicas"
                        checked={preferenciasNotif.noticias_publicaciones}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            noticias_publicaciones: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gh-text">
                          Estado y dictamen de mis propuestas
                        </p>
                        <p className="text-xs text-gh-muted">
                          Avisos cuando el CIT toma una propuesta en revisión o emite su dictamen técnico.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Estado y dictamen de mis propuestas"
                        checked={preferenciasNotif.cambios_propuestas}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            cambios_propuestas: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gh-text">
                          Publicación de nuevos servicios en catálogo
                        </p>
                        <p className="text-xs text-gh-muted">
                          Cuando se habilitan nuevos ensayos STAN o una propuesta se convierte en servicio oficial.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Publicación de nuevos servicios en catálogo"
                        checked={preferenciasNotif.nuevos_servicios}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            nuevos_servicios: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gh-text">
                          Actividad en mis solicitudes, resultados PDF y capacitaciones
                        </p>
                        <p className="text-xs text-gh-muted">
                          Cambios de estado en servicios contratados, entrega digital de informes y cursadas.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Actividad en mis solicitudes, resultados PDF y capacitaciones"
                        checked={preferenciasNotif.actividad_usuario}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            actividad_usuario: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 p-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gh-text">
                          Actualizaciones y comunicados de la plataforma
                        </p>
                        <p className="text-xs text-gh-muted">
                          Novedades generales de CITio y comunicados institucionales.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Actualizaciones y comunicados de la plataforma"
                        checked={preferenciasNotif.actualizaciones_plataforma}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            actualizaciones_plataforma: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>
                  </div>

                  {/* Canal WhatsApp integrado al Outbox */}
                  <div className="rounded-xl border border-cit-accent/50 bg-cit-forest/30 p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gh-text">
                            Recibir alertas automáticas vía WhatsApp
                          </p>
                          <Badge variant="success">Canal Rural Directo</Badge>
                        </div>
                        <p className="text-xs text-gh-muted">
                          {perfilForm.telefono_whatsapp
                            ? `Número vinculado: ${perfilForm.telefono_whatsapp}`
                            : "Aún no vinculaste un número de WhatsApp en Ajustes → Perfil."}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label="Recibir alertas automáticas vía WhatsApp"
                        checked={preferenciasNotif.canal_whatsapp}
                        onChange={(e) =>
                          setPreferenciasNotif((prev) => ({
                            ...prev,
                            canal_whatsapp: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gh-border bg-gh-surface text-cit-accent"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" loading={savingPreferencias}>
                      Guardar preferencias de notificaciones
                    </Button>
                  </div>
                </form>
              </Card>
            </section>
          )}

          {/* 4. AJUSTES / MI CUENTA (Eliminar cuenta) */}
          {seccionActiva === "mi-cuenta" && (
            <section className="space-y-6" aria-label="Gestión de Mi Cuenta">
              <Card className="space-y-3">
                <h2 className="text-lg font-semibold text-gh-text">
                  Estado de Mi Cuenta
                </h2>
                <div className="grid gap-3 rounded-lg border border-gh-elevated bg-gh-canvas p-3.5 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-gh-muted">Usuario</span>
                    <p className="mt-0.5 font-semibold text-white">
                      @{user.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-gh-muted">Correo registrado</span>
                    <p className="mt-0.5 font-semibold text-white">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gh-muted">Rol activo</span>
                    <p className="mt-0.5 font-semibold text-cit-accent-emphasis">
                      {labelDeRol(user.rol)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4 border-status-danger-emphasis/60 bg-status-danger-emphasis/5">
                <div className="space-y-1">
                  <Badge variant="danger">Zona de peligro</Badge>
                  <h2 className="text-lg font-semibold text-status-danger">
                    Eliminar mi cuenta
                  </h2>
                  <p className="text-xs leading-relaxed text-gh-muted">
                    Al eliminar tu cuenta se desactivará tu acceso a CITio, se cancelarán automáticamente tus solicitudes o propuestas que aún estén en estado <strong>Pendiente</strong> y se anonimizarán tus datos personales preservando la trazabilidad histórica institucional.
                  </p>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setError("");
                      setDeletePassword("");
                      setDeleteConfirmText("");
                      setModalEliminarAbierto(true);
                    }}
                  >
                    Eliminar cuenta
                  </Button>
                </div>
              </Card>
            </section>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar cuenta */}
      <Modal
        open={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Confirmar eliminación de cuenta"
      >
        <form onSubmit={handleConfirmarEliminarCuenta} className="space-y-4">
          <p className="text-xs leading-relaxed text-gh-muted">
            Esta acción desactivará tu cuenta de forma permanente. Para continuar, ingresá tu contraseña actual y escribí la palabra{" "}
            <strong className="text-status-danger">ELIMINAR</strong>.
          </p>

          <div>
            <label
              htmlFor="delete-account-password"
              className="mb-1.5 block text-xs font-medium text-gh-text"
            >
              Contraseña actual *
            </label>
            <input
              id="delete-account-password"
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="delete-account-confirm"
              className="mb-1.5 block text-xs font-medium text-gh-text"
            >
              Escribí ELIMINAR para confirmar *
            </label>
            <input
              id="delete-account-confirm"
              type="text"
              required
              placeholder="ELIMINAR"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={deletingAccount}>
              Confirmar eliminación definitiva
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de detalle completo de propuesta */}
      <Modal
        open={Boolean(propuestaSeleccionada)}
        onClose={() => setPropuestaSeleccionada(null)}
        title={
          propuestaSeleccionada
            ? `Detalle de propuesta: ${propuestaSeleccionada.titulo}`
            : "Detalle de propuesta"
        }
      >
        {propuestaSeleccionada && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="info">
                {propuestaSeleccionada.Sector?.nombre || "Sin área"}
              </Badge>
              <Badge
                variant={badgeVariantPorEstado(
                  propuestaSeleccionada.Estado?.codigo,
                )}
              >
                {etiquetaEstadoPropuesta(propuestaSeleccionada)}
              </Badge>
            </div>

            {propuestaSeleccionada.beneficiario_nombre && (
              <div className="rounded-lg border border-status-purple-emphasis/40 bg-status-purple-emphasis/10 p-3">
                <p className="font-semibold text-status-purple">
                  Presentada en representación de productor asociado:
                </p>
                <p className="mt-0.5 text-gh-text">
                  {propuestaSeleccionada.beneficiario_nombre}
                  {propuestaSeleccionada.beneficiario_dni_cuit
                    ? ` · DNI/CUIT: ${propuestaSeleccionada.beneficiario_dni_cuit}`
                    : ""}
                  {propuestaSeleccionada.beneficiario_localidad
                    ? ` · Localidad: ${propuestaSeleccionada.beneficiario_localidad}`
                    : ""}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="font-semibold text-gh-text">
                Descripción y problemática planteada:
              </p>
              <p className="whitespace-pre-line leading-relaxed text-gh-muted">
                {propuestaSeleccionada.problematica}
              </p>
            </div>

            {propuestaSeleccionada.bienes_recursos && (
              <div className="space-y-1">
                <p className="font-semibold text-gh-text">
                  Bienes y recursos propuestos:
                </p>
                <p className="text-gh-muted">
                  {propuestaSeleccionada.bienes_recursos}
                </p>
              </div>
            )}

            <div className="grid gap-2 rounded-lg border border-gh-elevated bg-gh-canvas p-3 sm:grid-cols-2">
              {propuestaSeleccionada.nombre_organismo && (
                <div>
                  <span className="font-semibold text-gh-text">
                    Organismo:{" "}
                  </span>
                  <span className="text-gh-muted">
                    {propuestaSeleccionada.nombre_organismo}
                  </span>
                </div>
              )}
              {propuestaSeleccionada.email_contacto && (
                <div>
                  <span className="font-semibold text-gh-text">Correo: </span>
                  <span className="text-gh-muted">
                    {propuestaSeleccionada.email_contacto}
                  </span>
                </div>
              )}
              {propuestaSeleccionada.telefono_contacto && (
                <div>
                  <span className="font-semibold text-gh-text">
                    Teléfono:{" "}
                  </span>
                  <span className="text-gh-muted">
                    {propuestaSeleccionada.telefono_contacto}
                  </span>
                </div>
              )}
              {propuestaSeleccionada.documento_url && (
                <div>
                  <span className="font-semibold text-gh-text">
                    Adjunto:{" "}
                  </span>
                  <a
                    href={propuestaSeleccionada.documento_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-status-info hover:underline"
                  >
                    {propuestaSeleccionada.documento_nombre ||
                      "Ver documento adjunto"}
                  </a>
                </div>
              )}
            </div>

            <StatusTimeline
              ariaLabel="Progreso de la propuesta"
              steps={buildPropuestaTimelineSteps(propuestaSeleccionada)}
            />

            {propuestaSeleccionada.citJustificacion && (
              <div className="rounded-lg border border-gh-border bg-gh-surface p-3">
                <p className="font-semibold text-gh-text">
                  Observaciones / Dictamen del CIT:
                </p>
                <p className="mt-1 text-gh-muted">
                  {propuestaSeleccionada.citJustificacion}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
