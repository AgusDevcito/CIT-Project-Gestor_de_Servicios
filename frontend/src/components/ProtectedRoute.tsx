import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import type { Rol } from "../domain/roles";

/**
 * Protege las rutas hijas.
 *
 * - Sin sesión: redirige a `/login`.
 * - Con `roles` y sin permiso: muestra un 403.
 * - En curso de verificación de sesión: muestra un estado de carga, para no
 *   redirigir antes de tiempo y evitar el "flash" de la pantalla de login.
 */
/**
 * Pantalla de estado (carga / 403). `fullScreen` se usa solo fuera del Layout
 * (login/registro); dentro del Layout ocupa el área de contenido, sin forzar
 * una altura mayor a la disponible.
 */
const PantallaEstado = ({
  fullScreen = false,
  children,
}: {
  fullScreen?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${
      fullScreen ? "min-h-screen bg-gh-canvas" : "min-h-[50vh]"
    }`}
  >
    {children}
  </div>
);

const MensajeCarga = () => (
  <span role="status" className="animate-pulse text-lg text-cit-accent-emphasis">
    Verificando sesión…
  </span>
);

export const ProtectedRoute = ({ roles }: { roles?: readonly Rol[] }) => {
  const { user, status } = useAuth();

  if (status === "cargando") {
    return (
      <PantallaEstado>
        <MensajeCarga />
      </PantallaEstado>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    return (
      <PantallaEstado>
        <h1 className="text-3xl font-bold text-cit-accent-emphasis">403</h1>
        <p className="text-gh-muted">No tenés permisos para acceder a esta sección.</p>
      </PantallaEstado>
    );
  }

  return <Outlet />;
};

/**
 * Guarda de rutas públicas: si ya hay sesión, no tiene sentido mostrar el
 * login o el registro.
 */
export const PublicOnlyRoute = () => {
  const { user, status } = useAuth();

  if (status === "cargando") {
    return (
      <PantallaEstado fullScreen>
        <MensajeCarga />
      </PantallaEstado>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
