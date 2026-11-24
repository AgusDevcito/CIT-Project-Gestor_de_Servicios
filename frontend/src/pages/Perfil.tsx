import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  badgeVariantPorEstado,
  badgeVariantPorRol,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
} from "../components/ui";
import { LinkButton } from "../components/ui/LinkButton";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../domain/errors";
import type {
  InscripcionCapacitacion,
  Propuesta,
  Solicitud,
} from "../domain/entidades";
import { labelDeRol } from "../domain/roles";
import {
  formatearFecha,
  formatearPrecio,
  obtenerInicialesUsuario,
  obtenerNombreVisible,
} from "../lib/formatters";
import {
  changePassword,
  getActividadPerfil,
  getProfileByUserId,
  updateProfile,
} from "../services/profileService";
import { deletePropuesta } from "../services/propuestasService";
import { deleteSolicitud } from "../services/solicitudesService";

interface FormularioPerfil {
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
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

const seguimientoDeSolicitud = (codigoEstado?: string | null): string => {
  const upper = (codigoEstado ?? "PENDIENTE").toUpperCase();
  if (upper === "PENDIENTE") {
    return "Solicitud recibida. Pendiente de asignación de turno y confirmación por el laboratorio del CIT.";
  }
  if (upper === "APROBADO" || upper === "ACEPTADA") {
    return "Contratación activa y aprobada. El equipo técnico del CIT se encuentra coordinando la ejecución del servicio.";
  }
  if (upper === "FINALIZADA") {
    return "Servicio completado e informe técnico emitido.";
  }
  if (upper === "RECHAZADO") {
    return "La solicitud no pudo ser procesada en esta instancia.";
  }
  return "En seguimiento por el Centro de Investigaciones y Transferencia.";
};

const etiquetaEstadoInscripcion = (estado?: string | null): string => {
  const upper = (estado ?? "INSCRIPTO").toUpperCase();
  if (upper === "INSCRIPTO") return "Inscripto";
  if (upper === "EN_CURSO") return "En curso";
  if (upper === "FINALIZADO") return "Finalizado";
  return upper;
};

export default function Perfil() {
  const { user, refresh } = useAuth();

  const [form, setForm] = useState<FormularioPerfil>({
    first_name: user?.nombre ?? "",
    last_name: user?.apellido ?? "",
    avatar_url: user?.avatarUrl ?? "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState<FormularioPassword>(
    INITIAL_PASSWORD_FORM,
  );

  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [serviciosContratados, setServiciosContratados] = useState<Solicitud[]>(
    [],
  );
  const [capacitaciones, setCapacitaciones] = useState<
    InscripcionCapacitacion[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deletingPropuestaId, setDeletingPropuestaId] = useState<number | null>(null);
  const [deletingSolicitudId, setDeletingSolicitudId] = useState<number | null>(null);

  // Modal de detalle de propuesta y resultado de revisión
  const [propuestaDetalle, setPropuestaDetalle] = useState<Propuesta | null>(
    null,
  );

  const cargarDatosPerfil = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [perfilRemoto, actividad] = await Promise.all([
        getProfileByUserId(user.id),
        getActividadPerfil(user.id),
      ]);

      setForm({
        first_name: perfilRemoto.first_name ?? user.nombre ?? "",
        last_name: perfilRemoto.last_name ?? user.apellido ?? "",
        avatar_url: perfilRemoto.avatar_url ?? user.avatarUrl ?? "",
        bio: perfilRemoto.bio ?? "",
      });

      setPropuestas(actividad.propuestas);
      setServiciosContratados(actividad.servicios);
      setCapacitaciones(actividad.capacitaciones);
    } catch (err) {
      setError(
        getApiError(err, "No se pudo cargar la información del perfil."),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void cargarDatosPerfil();
  }, [cargarDatosPerfil]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setFeedback("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("El nombre y el apellido son obligatorios.");
      return;
    }

    setSavingProfile(true);
    try {
      const actualizado = await updateProfile(user.id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        avatar_url: form.avatar_url.trim(),
        bio: form.bio.trim(),
      });

      setForm({
        first_name: actualizado.first_name,
        last_name: actualizado.last_name,
        avatar_url: actualizado.avatar_url ?? "",
        bio: actualizado.bio ?? "",
      });

      await refresh();
      setFeedback("Información personal actualizada correctamente.");
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

    if (newPassword.length < 6 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
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
    setDeletingPropuestaId(propuesta.id);
    try {
      await deletePropuesta(propuesta.id);
      setPropuestas((prev) => prev.filter((p) => p.id !== propuesta.id));
      setFeedback(`La propuesta "${propuesta.titulo}" fue eliminada exitosamente.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la propuesta."));
    } finally {
      setDeletingPropuestaId(null);
    }
  };

  const handleDeleteSolicitud = async (solicitud: Solicitud) => {
    const nombre = solicitud.Servicio?.servicio_nombre || `Solicitud #${solicitud.id}`;
    if (
      !window.confirm(
        `¿Estás seguro de que deseás eliminar la solicitud para "${nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError("");
    setFeedback("");
    setDeletingSolicitudId(solicitud.id);
    try {
      await deleteSolicitud(solicitud.id);
      setServiciosContratados((prev) => prev.filter((s) => s.id !== solicitud.id));
      setFeedback(`La solicitud de servicio fue eliminada exitosamente.`);
    } catch (err) {
      setError(getApiError(err, "No se pudo eliminar la solicitud."));
    } finally {
      setDeletingSolicitudId(null);
    }
  };

  if (!user) return null;

  const nombreVisible = obtenerNombreVisible({
    nombre: form.first_name || user.nombre,
    apellido: form.last_name || user.apellido,
    username: user.username,
  });
  const iniciales = obtenerInicialesUsuario({
    nombre: form.first_name || user.nombre,
    apellido: form.last_name || user.apellido,
    username: user.username,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Perfil"
        subtitle="Consultá y editá tu información personal, y revisá el estado de tus propuestas, servicios contratados y capacitaciones en CITio."
        actions={
          <LinkButton to="/ajustes/perfil">
            Editar perfil
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: Identidad de usuario y atributos protegidos */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="space-y-5">
            <div className="flex items-center gap-4">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt={`Avatar de ${nombreVisible}`}
                  className="h-20 w-20 rounded-full border border-gh-border object-cover"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-cit-accent-hover/50 bg-cit-forest-raised text-2xl font-bold text-cit-accent-emphasis"
                  aria-label={`Iniciales de ${nombreVisible}`}
                >
                  {iniciales}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-gh-text">
                  {nombreVisible}
                </h2>
                <p className="truncate text-sm text-gh-muted">
                  @{user.username}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={badgeVariantPorRol(user.rol)}>
                    {labelDeRol(user.rol)}
                  </Badge>
                </div>
              </div>
            </div>

            {form.bio && (
              <p className="rounded-lg border border-gh-elevated bg-gh-canvas/70 p-3 text-sm leading-relaxed text-gh-text">
                {form.bio}
              </p>
            )}

            <dl className="space-y-2.5 border-t border-gh-elevated pt-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-gh-muted">Correo electrónico</dt>
                <dd className="truncate font-medium text-gh-text">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-gh-muted">Usuario</dt>
                <dd className="font-medium text-gh-text">@{user.username}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-gh-muted">Nivel de acceso</dt>
                <dd className="font-medium text-gh-text">
                  {labelDeRol(user.rol)}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-3 gap-2 border-t border-gh-elevated pt-4 text-center">
              <div className="rounded-lg border border-gh-elevated bg-gh-canvas p-2">
                <p className="text-lg font-bold text-gh-text">
                  {propuestas.length}
                </p>
                <p className="text-xs text-gh-muted">Propuestas</p>
              </div>
              <div className="rounded-lg border border-gh-elevated bg-gh-canvas p-2">
                <p className="text-lg font-bold text-gh-text">
                  {serviciosContratados.length}
                </p>
                <p className="text-xs text-gh-muted">Servicios</p>
              </div>
              <div className="rounded-lg border border-gh-elevated bg-gh-canvas p-2">
                <p className="text-lg font-bold text-gh-text">
                  {capacitaciones.length}
                </p>
                <p className="text-xs text-gh-muted">Capacitaciones</p>
              </div>
            </div>
          </Card>

          {/* Seguridad: Cambio de contraseña */}
          <Card className="space-y-4">
            <div className="border-b border-gh-elevated pb-3">
              <h2 className="text-base font-semibold text-gh-text">
                Seguridad de la cuenta
              </h2>
              <p className="text-xs text-gh-muted">
                Actualizá tu contraseña de acceso.
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label
                  htmlFor="perfil-current-password"
                  className="mb-1 block text-xs font-medium text-gh-text"
                >
                  Contraseña actual
                </label>
                <input
                  id="perfil-current-password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="perfil-new-password"
                  className="mb-1 block text-xs font-medium text-gh-text"
                >
                  Nueva contraseña
                </label>
                <input
                  id="perfil-new-password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="perfil-confirm-password"
                  className="mb-1 block text-xs font-medium text-gh-text"
                >
                  Confirmar nueva contraseña
                </label>
                <input
                  id="perfil-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input-base"
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                loading={savingPassword}
                className="w-full"
              >
                Actualizar contraseña
              </Button>
            </form>
          </Card>
        </div>

        {/* Columna derecha: Edición de Perfil + Mis Propuestas + Mis Servicios + Mis Capacitaciones */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Formulario de Información Personal */}
          <Card className="space-y-4">
            <div className="border-b border-gh-elevated pb-3">
              <h2 className="text-lg font-semibold text-gh-text">
                Información personal
              </h2>
              <p className="text-xs text-gh-muted">
                Podés modificar tu nombre, descripción personal y avatar. El correo electrónico, rol y permisos institucionales son administrados por el sistema.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="perfil-nombre"
                    className="mb-1.5 block text-xs font-medium text-gh-text"
                  >
                    Nombre *
                  </label>
                  <input
                    id="perfil-nombre"
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={handleProfileChange}
                    className="input-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="perfil-apellido"
                    className="mb-1.5 block text-xs font-medium text-gh-text"
                  >
                    Apellido *
                  </label>
                  <input
                    id="perfil-apellido"
                    name="last_name"
                    required
                    value={form.last_name}
                    onChange={handleProfileChange}
                    className="input-base"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="perfil-bio"
                    className="mb-1.5 block text-xs font-medium text-gh-text"
                  >
                    Información personal o descripción
                  </label>
                  <textarea
                    id="perfil-bio"
                    name="bio"
                    rows={3}
                    maxLength={1000}
                    placeholder="Describí tu actividad profesional, organización a la que pertenecés o área de interés en el CIT…"
                    value={form.bio}
                    onChange={handleProfileChange}
                    className="input-base"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="perfil-avatar"
                    className="mb-1.5 block text-xs font-medium text-gh-text"
                  >
                    URL del avatar (opcional)
                  </label>
                  <input
                    id="perfil-avatar"
                    name="avatar_url"
                    type="url"
                    placeholder="https://ejemplo.com/mi-avatar.png"
                    value={form.avatar_url}
                    onChange={handleProfileChange}
                    className="input-base"
                  />
                </div>

                {/* Campos administrativos protegidos (solo lectura) */}
                <div>
                  <label
                    htmlFor="perfil-email-readonly"
                    className="mb-1.5 block text-xs font-medium text-gh-muted"
                  >
                    Correo electrónico (no modificable)
                  </label>
                  <input
                    id="perfil-email-readonly"
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="input-base cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="perfil-rol-readonly"
                    className="mb-1.5 block text-xs font-medium text-gh-muted"
                  >
                    Rol y permisos en el sistema (no modificable)
                  </label>
                  <input
                    id="perfil-rol-readonly"
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
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Card>

          {/* 2. Sección Mis Propuestas */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-elevated pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gh-text">
                  Mis Propuestas
                </h2>
                <p className="text-xs text-gh-muted">
                  Propuestas presentadas ante el CIT y resultado de su evaluación técnica.
                </p>
              </div>
              <Badge variant="neutral">{propuestas.length}</Badge>
            </div>

            {loading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : propuestas.length === 0 ? (
              <EmptyState
                title="No presentaste propuestas todavía"
                description="Las propuestas que envíes desde el apartado de Propuestas aparecerán aquí con su estado de revisión."
              />
            ) : (
              <div className="divide-y divide-gh-elevated">
                {propuestas.map((prop) => {
                  const codigoEstado = (
                    prop.Estado?.codigo ?? "PENDIENTE"
                  ).toUpperCase();
                  return (
                    <div
                      key={prop.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gh-text">
                            {prop.titulo}
                          </p>
                          <Badge variant="info">
                            {prop.Sector?.nombre || "Sin área"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gh-muted">
                          Presentada el {formatearFecha(prop.createdAt)}
                          {prop.nombre_organismo
                            ? ` · Organismo: ${prop.nombre_organismo}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                          {prop.Estado?.nombre ?? codigoEstado}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setPropuestaDetalle(prop)}
                        >
                          Ver detalles y revisión
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          loading={deletingPropuestaId === prop.id}
                          onClick={() => void handleDeletePropuesta(prop)}
                          aria-label={`Eliminar propuesta ${prop.titulo}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 3. Sección Mis Servicios */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-elevated pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gh-text">
                  Mis Servicios
                </h2>
                <p className="text-xs text-gh-muted">
                  Servicios contratados o solicitados al catálogo del CIT y su estado de seguimiento.
                </p>
              </div>
              <Badge variant="neutral">{serviciosContratados.length}</Badge>
            </div>

            {loading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : serviciosContratados.length === 0 ? (
              <EmptyState
                title="No tenés servicios contratados o activos"
                description="Podés consultar y solicitar ensayos o asistencia técnica en el catálogo de Servicios."
                action={
                  <LinkButton to="/servicios" variant="secondary" size="sm">
                    Explorar catálogo de servicios
                  </LinkButton>
                }
              />
            ) : (
              <div className="divide-y divide-gh-elevated">
                {serviciosContratados.map((sol) => {
                  const codigoEstado = (
                    sol.Estado?.codigo ?? "PENDIENTE"
                  ).toUpperCase();
                  const nombreServicio =
                    sol.Servicio?.servicio_nombre ||
                    `Servicio #${sol.servicio_id}`;
                  return (
                    <div
                      key={sol.id}
                      className="space-y-2 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <Link
                            to={`/servicios/${sol.servicio_id}`}
                            className="font-semibold text-gh-text hover:text-status-info hover:underline"
                          >
                            {nombreServicio}
                          </Link>
                          <p className="text-xs text-gh-muted">
                            Fecha de contratación:{" "}
                            {formatearFecha(
                              sol.fecha_solicitud || sol.createdAt,
                            )}
                            {sol.Servicio?.servicio_precio !== undefined
                              ? ` · Arancel: ${formatearPrecio(
                                  sol.Servicio.servicio_precio,
                                )}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariantPorEstado(codigoEstado)}>
                            {sol.Estado?.nombre ?? codigoEstado}
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            loading={deletingSolicitudId === sol.id}
                            onClick={() => void handleDeleteSolicitud(sol)}
                            aria-label={`Eliminar solicitud ${nombreServicio}`}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      <p className="rounded-md border border-gh-elevated bg-gh-canvas/70 px-3 py-2 text-xs text-gh-muted">
                        <strong className="text-gh-text">Seguimiento:</strong>{" "}
                        {seguimientoDeSolicitud(codigoEstado)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 4. Sección Mis Capacitaciones */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-elevated pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gh-text">
                  Mis Capacitaciones
                </h2>
                <p className="text-xs text-gh-muted">
                  Capacitaciones, talleres y jornadas en las que registraste tu inscripción o participación.
                </p>
              </div>
              <Badge variant="neutral">{capacitaciones.length}</Badge>
            </div>

            {loading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : capacitaciones.length === 0 ? (
              <EmptyState
                title="No registrás inscripciones en capacitaciones"
                description="Consultá los avisos de inscripción y capacitaciones vigentes en el apartado de Publicaciones."
                action={
                  <LinkButton to="/publicaciones" variant="secondary" size="sm">
                    Ver capacitaciones disponibles
                  </LinkButton>
                }
              />
            ) : (
              <div className="divide-y divide-gh-elevated">
                {capacitaciones.map((insc) => {
                  const pub = insc.Publicacion;
                  return (
                    <div
                      key={insc.id}
                      className="space-y-2 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <Link
                            to={`/publicaciones/${insc.publicacion_id}`}
                            className="font-semibold text-gh-text hover:text-status-info hover:underline"
                          >
                            {pub?.titulo ||
                              `Capacitación #${insc.publicacion_id}`}
                          </Link>
                          <p className="text-xs text-gh-muted">
                            Inscripto el {formatearFecha(insc.createdAt)}
                            {pub?.Sector?.nombre
                              ? ` · Área: ${pub.Sector.nombre}`
                              : ""}
                          </p>
                        </div>

                        <Badge variant="success">
                          {etiquetaEstadoInscripcion(insc.estado)}
                        </Badge>
                      </div>

                      {pub?.contenido && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-gh-muted">
                          {pub.contenido}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de detalle de propuesta y resultado de revisión */}
      <Modal
        open={Boolean(propuestaDetalle)}
        onClose={() => setPropuestaDetalle(null)}
        title={propuestaDetalle?.titulo || "Detalle de la propuesta"}
      >
        {propuestaDetalle && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gh-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  {propuestaDetalle.Sector?.nombre || "Sin área"}
                </Badge>
                <span className="text-xs text-gh-muted">
                  Presentada el {formatearFecha(propuestaDetalle.createdAt)}
                </span>
              </div>
              <Badge
                variant={badgeVariantPorEstado(propuestaDetalle.Estado?.codigo)}
              >
                {propuestaDetalle.Estado?.nombre ??
                  propuestaDetalle.Estado?.codigo ??
                  "Pendiente"}
              </Badge>
            </div>

            {propuestaDetalle.nombre_organismo && (
              <div>
                <p className="text-xs font-semibold uppercase text-gh-muted">
                  Organismo presentante
                </p>
                <p className="mt-0.5 text-gh-text">
                  {propuestaDetalle.nombre_organismo}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-gh-muted">
                Utilidad y funciones
              </p>
              <p className="mt-1 whitespace-pre-line text-gh-text">
                {propuestaDetalle.problematica}
              </p>
            </div>

            {propuestaDetalle.bienes_recursos && (
              <div>
                <p className="text-xs font-semibold uppercase text-gh-muted">
                  Bienes y recursos propuestos
                </p>
                <p className="mt-1 whitespace-pre-line text-gh-text">
                  {propuestaDetalle.bienes_recursos}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gh-border bg-gh-canvas p-3.5">
              <p className="text-xs font-semibold uppercase text-cit-accent-emphasis">
                Resultado de la revisión CIT
              </p>
              {propuestaDetalle.citJustificacion ? (
                <div className="mt-1.5 space-y-2">
                  <p className="text-sm text-gh-text">
                    {propuestaDetalle.citJustificacion}
                  </p>
                  {propuestaDetalle.citFechaRevision && (
                    <p className="text-xs text-gh-muted">
                      Fecha de dictamen:{" "}
                      {formatearFecha(propuestaDetalle.citFechaRevision)}
                    </p>
                  )}
                  {propuestaDetalle.servicio_generado_id && (
                    <div className="pt-1">
                      <Link
                        to={`/servicios/${propuestaDetalle.servicio_generado_id}`}
                        className="text-xs font-semibold text-status-info hover:underline"
                      >
                        Ir al servicio publicado en el catálogo →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-gh-muted">
                  Esta propuesta aún no cuenta con un dictamen final emitido.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
