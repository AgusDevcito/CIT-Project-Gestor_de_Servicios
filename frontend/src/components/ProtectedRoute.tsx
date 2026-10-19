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
export const ProtectedRoute = ({ roles }: { roles?: readonly Rol[] }) => {
  const { user, status } = useAuth();

  if (status === "cargando") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cit-900">
        <span className="animate-pulse text-lg text-cit-neon">Verificando sesión…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cit-900 px-4 text-center">
        <h1 className="text-3xl font-bold text-cit-neon">403</h1>
        <p className="text-slate-300">No tienes permisos para acceder a esta sección.</p>
      </div>
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
      <div className="flex min-h-screen items-center justify-center bg-cit-900">
        <span className="animate-pulse text-lg text-cit-neon">Verificando sesión…</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
