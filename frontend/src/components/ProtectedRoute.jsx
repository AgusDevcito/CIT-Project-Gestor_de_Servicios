import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege las rutas hijas: exige sesión y, opcionalmente, un rol específico.
export const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cit-900">
        <span className="animate-pulse text-lg text-cit-neon">Verificando sesión…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cit-900 px-4 text-center">
        <h1 className="text-3xl font-bold text-cit-neon">403</h1>
        <p className="text-slate-300">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return <Outlet />;
};
