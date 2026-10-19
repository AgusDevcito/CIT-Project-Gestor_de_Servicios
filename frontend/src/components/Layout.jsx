import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoCitio from '../assets/logo-CITio.png';

const NAV_LINKS = [{ to: '/', label: 'Inicio', end: true }];

const ROLE_LABELS = {
  cit: 'Personal CIT',
  user: 'Usuario',
  admin: 'Admin',
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-cit-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-cit-600/40 bg-cit-800">
        <div className="flex items-center gap-2 border-b border-cit-600/40 px-4 py-4">
          <img src={logoCitio} alt="Logo CITio" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-bold leading-tight text-cit-neon">CITio</p>
            <p className="text-xs leading-tight text-slate-300">Gestor de Servicios</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-cit-600 text-white'
                    : 'text-slate-300 hover:bg-cit-700 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-cit-600/40 p-3">
          <span className="self-start rounded-full border border-cit-neon/40 px-3 py-1 text-xs text-cit-neon">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
          <button
            onClick={logout}
            className="rounded-lg bg-cit-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-red-900/60 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
