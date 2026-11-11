import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { esPersonalCIT, labelDeRol, type Rol } from "../domain/roles";
import {
  obtenerInicialesUsuario,
  obtenerNombreVisible,
} from "../lib/formatters";
import logoCitio from "../assets/logo-CITio.png";
import { Badge, badgeVariantPorRol } from "./ui/Badge";

interface NavItemConfig {
  to: string;
  label: string;
  end: boolean;
  icon: ReactNode;
  onlyCIT?: boolean;
  roleTag?: (rol?: Rol) => string | null;
}

const NAV_LINKS: readonly NavItemConfig[] = [
  {
    to: "/",
    label: "Inicio",
    end: true,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z" />
      </svg>
    ),
    roleTag: (rol) => (rol === "admin" ? "Admin" : esPersonalCIT(rol) ? "CIT" : null),
  },
  {
    to: "/servicios",
    label: "Servicios",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
      </svg>
    ),
    roleTag: (rol) => (esPersonalCIT(rol) ? "Catálogo / Alta" : "Solicitar"),
  },
  {
    to: "/solicitudes",
    label: "Solicitudes",
    end: false,
    onlyCIT: true,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
      </svg>
    ),
    roleTag: () => "Revisión CIT",
  },
  {
    to: "/publicaciones",
    label: "Publicaciones",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
      </svg>
    ),
    roleTag: (rol) => (esPersonalCIT(rol) ? "ABM" : "Lectura"),
  },
  {
    to: "/propuestas",
    label: "Propuestas",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
      </svg>
    ),
    roleTag: (rol) => (esPersonalCIT(rol) ? "Dictamen" : "Proponer"),
  },
  {
    to: "/perfil",
    label: "Mi Perfil",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
      </svg>
    ),
    roleTag: () => null,
  },
] as const;

const descripcionModoPorRol = (rol?: Rol): string => {
  if (rol === "admin") return "Administración General CIT";
  if (rol === "cit") return "Gestión Técnica CIT";
  return "Portal de Servicios";
};

const obtenerTituloSeccion = (pathname: string): string => {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/servicios")) return "Servicios";
  if (pathname.startsWith("/solicitudes")) return "Solicitudes";
  if (pathname.startsWith("/publicaciones")) return "Publicaciones";
  if (pathname.startsWith("/propuestas")) return "Propuestas";
  if (pathname.startsWith("/perfil")) return "Mi Perfil";
  return "Panel";
};

function UserAvatar({
  avatarUrl,
  nombre,
  apellido,
  username,
  sizeClass = "h-8 w-8 text-xs",
}: {
  avatarUrl?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  username?: string | null;
  sizeClass?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const iniciales = obtenerInicialesUsuario({ nombre, apellido, username });

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${username || "usuario"}`}
        onError={() => setImgError(true)}
        className={`${sizeClass} shrink-0 rounded-full border border-[#447232]/60 object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-[#447232]/60 bg-[#14351a] font-semibold text-[#3fb950]`}
    >
      {iniciales}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const seccionActual = obtenerTituloSeccion(location.pathname);
  const nombreVisible = user ? obtenerNombreVisible(user) : "";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117] text-[#e6edf3]">
      {/* Barra superior de navegación consistente */}
      <header
        aria-label="Barra superior de navegación"
        className="sticky top-0 z-30 border-b border-[#447232]/40 bg-[#0d2e0f] px-4 py-2.5 shadow-sm"
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          {/* Izquierda: botón móvil, toggle para ocultar/mostrar barra lateral, logo y sección activa */}
          <div className="flex items-center gap-2.5">
            {/* Botón hamburguesa para pantallas móviles */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú móvil"
                  : "Abrir menú móvil"
              }
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#447232]/50 bg-[#14351a] text-[#e6edf3] hover:bg-[#1e4b25] md:hidden"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
              </svg>
            </button>

            {/* Botón para ocultar / volver a mostrar la barra lateral */}
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={
                sidebarOpen
                  ? "Ocultar barra lateral"
                  : "Mostrar barra lateral"
              }
              title={
                sidebarOpen
                  ? "Ocultar barra lateral"
                  : "Mostrar barra lateral"
              }
              className="hidden items-center gap-1.5 rounded-md border border-[#447232]/50 bg-[#14351a] px-2.5 py-1.5 text-xs font-medium text-[#e6edf3] transition-colors hover:border-[#3fb950] hover:bg-[#1e4b25] md:inline-flex"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-[#3fb950]" aria-hidden="true">
                <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25H4.5v-11ZM6 13.5h8.25a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H6Z" />
              </svg>
              <span>{sidebarOpen ? "Ocultar barra" : "Mostrar barra"}</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-opacity hover:opacity-90"
            >
              <img
                src={logoCitio}
                alt="Logo CITio"
                className="h-7 w-7 object-contain"
              />
              <span className="text-base font-bold tracking-tight text-white">
                CITio
              </span>
            </Link>

            <span aria-hidden="true" className="hidden text-[#8b949e] sm:inline">
              /
            </span>
            <span className="hidden text-sm font-medium text-[#3fb950] sm:inline">
              {seccionActual}
            </span>
          </div>

          {/* Derecha: información según rol y acceso al perfil en la esquina superior */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="text-xs text-slate-300">
                    {descripcionModoPorRol(user.rol)}
                  </span>
                  <Badge variant={badgeVariantPorRol(user.rol)}>
                    {labelDeRol(user.rol)}
                  </Badge>
                </div>

                {/* Acceso al perfil en la esquina superior */}
                <Link
                  to="/perfil"
                  aria-label="Ir a Mi Perfil"
                  title="Ver y editar Mi Perfil"
                  className="flex items-center gap-2 rounded-md border border-[#447232]/50 bg-[#14351a] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-[#3fb950] hover:bg-[#1e4b25]"
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    nombre={user.nombre}
                    apellido={user.apellido}
                    username={user.username}
                    sizeClass="h-6 w-6 text-[11px]"
                  />
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[140px] truncate font-semibold leading-tight text-white">
                      {nombreVisible}
                    </p>
                    <p className="max-w-[140px] truncate text-[11px] leading-tight text-slate-300">
                      @{user.username}
                    </p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-md border border-[#447232]/60 bg-[#14351a] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1e4b25]"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-[#258f2a] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2ea043]"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cuerpo principal: Barra lateral verde (ocultable) + Área de contenido */}
      <div className="relative flex flex-1">
        {/* Backdrop móvil */}
        {mobileMenuOpen && (
          <div
            onClick={closeMobileMenu}
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Barra lateral verde institucional (oculta en desktop si sidebarOpen === false) */}
        {sidebarOpen && (
          <aside
            aria-label="Navegación principal"
            className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-[#447232]/40 bg-[#0d2e0f] transition-transform duration-200 md:static md:translate-x-0 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Cabecera del sidebar */}
            <div className="flex items-center justify-between border-b border-[#447232]/40 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoCitio}
                  alt="Logo CITio"
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <p className="text-sm font-bold leading-tight text-[#3fb950]">
                    CITio
                  </p>
                  <p className="text-xs leading-tight text-slate-300">
                    Gestor de Servicios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Cerrar panel lateral"
                className="rounded-md p-1 text-slate-300 hover:bg-[#14351a] hover:text-white md:hidden"
              >
                ✕
              </button>
            </div>

            {/* Enlaces de secciones */}
            <nav className="flex flex-1 flex-col gap-1 p-3">
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300/80">
                Secciones
              </p>
              {NAV_LINKS.filter(
                (item) => !item.onlyCIT || esPersonalCIT(user?.rol),
              ).map(({ to, label, end, icon, roleTag }) => {
                const tag = user ? roleTag?.(user.rol) : null;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#238636] text-white shadow-[inset_3px_0_0_#3fb950]"
                          : "text-slate-200 hover:bg-[#14351a] hover:text-white"
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      {icon}
                      <span>{label}</span>
                    </span>
                    {tag && (
                      <span className="rounded border border-[#447232]/60 bg-[#091f0b] px-1.5 py-0.5 text-[10px] font-normal text-[#3fb950]">
                        {tag}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Pie del sidebar: resumen de sesión o acciones anónimas */}
            <div className="mt-auto flex flex-col gap-3 border-t border-[#447232]/40 bg-[#091f0b]/70 p-3.5">
              {user ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {nombreVisible}
                      </p>
                      <p className="truncate text-[11px] text-slate-300">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant={badgeVariantPorRol(user.rol)}>
                      {labelDeRol(user.rol)}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#447232]/50 bg-[#14351a] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#f85149]/60 hover:bg-red-900/60 hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-300">
                    Iniciá sesión para gestionar servicios y propuestas.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="rounded-md border border-[#447232]/60 bg-[#14351a] px-2.5 py-1.5 text-center text-xs font-medium text-white hover:bg-[#1e4b25]"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="rounded-md bg-[#258f2a] px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:bg-[#2ea043]"
                    >
                      Registrarse
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Contenedor principal de la vista actual */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
