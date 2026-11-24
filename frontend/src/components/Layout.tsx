import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { esPersonalCIT, labelDeRol, type Rol } from "../domain/roles";
import {
  obtenerInicialesUsuario,
  obtenerNombreVisible,
} from "../lib/formatters";
import logoCitio from "../assets/logo-CITio.png";
import { NotificationBell } from "./NotificationBell";
import { Badge, badgeVariantPorRol } from "./ui/Badge";

interface NavItemConfig {
  to: string;
  label: string;
  end: boolean;
  icon: ReactNode;
  onlyCIT?: boolean;
  requireAuth?: boolean;
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
  },
  {
    to: "/capacitaciones",
    label: "Capacitaciones",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M7.691 1.066a.75.75 0 0 1 .618 0l7.25 3.25a.75.75 0 0 1 0 1.368L13 6.831v2.794c0 1.024-.81 1.749-1.66 2.173-.893.447-2.075.702-3.34.702-.278 0-.55-.012-.816-.036a.75.75 0 0 1 .133-1.494c.22.02.45.03.683.03 1.082 0 2.025-.221 2.67-.543.69-.345.83-.682.83-.832V7.503L8.309 8.934a.75.75 0 0 1-.618 0L4 7.28v1.663c.296.105.575.275.812.512.438.438.688 1.059.688 1.795v3a.75.75 0 0 1-1.5 0v-3c0-.368-.125-.617-.25-.742a.87.87 0 0 0-.75-.258.87.87 0 0 0-.75.258c-.125.125-.25.374-.25.742v3a.75.75 0 0 1-1.5 0v-3c0-.736.25-1.357.688-1.795.237-.237.516-.407.812-.512V6.606L.441 5.684a.75.75 0 0 1 0-1.368ZM2.583 5 8 7.428 13.417 5 8 2.572Z" />
      </svg>
    ),
  },
  {
    to: "/mis-servicios",
    label: "Mis Servicios",
    end: false,
    requireAuth: true,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5c-.55 0-1.07-.26-1.4-.7l-.9-1.2a.25.25 0 0 0-.2-.1Zm-.25-1.5h3.7c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1h6.55c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.784.784 1 1.75 1Z" />
      </svg>
    ),
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
  },
  {
    to: "/proponer",
    label: "Proponer",
    end: false,
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
      </svg>
    ),
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
  if (pathname.startsWith("/capacitaciones")) return "Capacitaciones";
  if (pathname.startsWith("/mis-servicios")) return "Mis Servicios";
  if (pathname.startsWith("/solicitudes")) return "Solicitudes";
  if (pathname.startsWith("/publicaciones")) return "Publicaciones";
  if (pathname.startsWith("/proponer") || pathname.startsWith("/propuestas")) {
    return "Proponer";
  }
  if (pathname.startsWith("/notificaciones")) return "Notificaciones";
  if (pathname.startsWith("/ajustes")) return "Ajustes";
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
        className={`${sizeClass} shrink-0 rounded-full border border-cit-forest-border/60 object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-cit-forest-border/60 bg-cit-forest-raised font-semibold text-cit-accent-emphasis`}
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

  // Cierra el menú móvil con Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-gh-canvas text-gh-text">
      {/* Barra superior de navegación consistente */}
      <header
        aria-label="Barra superior de navegación"
        className="sticky top-0 z-40 flex h-14 items-center border-b border-cit-forest-border/40 bg-cit-forest px-4 shadow-sm"
      >
        <div className="flex w-full items-center justify-between gap-3">
          {/* Izquierda: botón móvil, toggle para ocultar/mostrar barra lateral, logo y sección activa */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú móvil"
                  : "Abrir menú móvil"
              }
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cit-forest-border/50 bg-cit-forest-raised text-gh-text hover:bg-cit-forest-hover md:hidden"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
              </svg>
            </button>

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
              className="hidden items-center gap-1.5 rounded-md border border-cit-forest-border/50 bg-cit-forest-raised px-2.5 py-1.5 text-xs font-medium text-gh-text transition-colors hover:border-cit-accent-emphasis hover:bg-cit-forest-hover md:inline-flex"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-cit-accent-emphasis" aria-hidden="true">
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

            <span aria-hidden="true" className="hidden text-gh-muted sm:inline">
              /
            </span>
            <span className="hidden text-sm font-medium text-cit-accent-emphasis sm:inline">
              {seccionActual}
            </span>
          </div>

          {/* Derecha: información según rol, tuerquita de Ajustes y acceso al perfil */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="text-xs text-gh-muted">
                    {descripcionModoPorRol(user.rol)}
                  </span>
                  <Badge variant={badgeVariantPorRol(user.rol)}>
                    {labelDeRol(user.rol)}
                  </Badge>
                </div>

                {/* Campanilla de Notificaciones 🔔 (Nivel 5) */}
                <NotificationBell />

                {/* Acceso a Ajustes (tuerquita ⚙️) */}
                <Link
                  to="/ajustes/propuestas"
                  aria-label="Ir a Ajustes"
                  title="Ajustes y mis propuestas"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cit-forest-border/50 bg-cit-forest-raised text-gh-text transition-colors hover:border-cit-accent-emphasis hover:bg-cit-forest-hover hover:text-white"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.219.31-.412.641-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.349.354.68.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.219-.31.411-.641.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z" />
                  </svg>
                </Link>

                {/* Acceso al perfil en la esquina superior */}
                <Link
                  to="/perfil"
                  aria-label="Ir a Mi Perfil"
                  title="Ver y editar Mi Perfil"
                  className="flex items-center gap-2 rounded-md border border-cit-forest-border/50 bg-cit-forest-raised px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-cit-accent-emphasis hover:bg-cit-forest-hover"
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    nombre={user.nombre}
                    apellido={user.apellido}
                    username={user.username}
                    sizeClass="h-6 w-6 text-xs"
                  />
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[140px] truncate font-semibold leading-tight text-white">
                      {nombreVisible}
                    </p>
                    <p className="max-w-[140px] truncate text-xs leading-tight text-gh-muted">
                      @{user.username}
                    </p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-md border border-cit-forest-border/60 bg-cit-forest-raised px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cit-forest-hover"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-cit-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cit-accent-hover"
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
        {mobileMenuOpen && (
          <div
            onClick={closeMobileMenu}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {(sidebarOpen || mobileMenuOpen) && (
          <aside
            aria-label="Navegación principal"
            className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-cit-forest-border/40 bg-cit-forest transition-transform duration-200 md:sticky md:bottom-auto md:top-14 md:z-20 md:h-[calc(100vh-3.5rem)] md:translate-x-0 md:self-start md:overflow-y-auto ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } ${sidebarOpen ? "" : "md:hidden"}`}
          >
            <div className="flex items-center justify-between border-b border-cit-forest-border/40 px-4 py-3.5 md:hidden">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoCitio}
                  alt="Logo CITio"
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <p className="text-sm font-bold leading-tight text-cit-accent-emphasis">
                    CITio
                  </p>
                  <p className="text-xs leading-tight text-gh-muted">
                    Gestor de Servicios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Cerrar panel lateral"
                className="rounded-md p-1 text-gh-muted hover:bg-cit-forest-raised hover:text-white md:hidden"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
              <p className="px-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gh-muted">
                Secciones
              </p>
              {NAV_LINKS.filter((item) => {
                if (item.onlyCIT && !esPersonalCIT(user?.rol)) return false;
                if (item.requireAuth && !user) return false;
                return true;
              }).map(({ to, label, end, icon }) => {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-cit-accent text-white shadow-[inset_3px_0_0_#3fb950]"
                          : "text-gh-text hover:bg-cit-forest-raised hover:text-white"
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      {icon}
                      <span>{label}</span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t border-cit-forest-border/40 bg-cit-forest-deep/70 p-3.5">
              {user ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {nombreVisible}
                      </p>
                      <p className="truncate text-xs text-gh-muted">
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-cit-forest-border/50 bg-cit-forest-raised px-3 py-1.5 text-xs font-medium text-gh-text transition-colors hover:border-status-danger/60 hover:bg-red-900/60 hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gh-muted">
                    Iniciá sesión para gestionar servicios y propuestas.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="rounded-md border border-cit-forest-border/60 bg-cit-forest-raised px-2.5 py-1.5 text-center text-xs font-medium text-white hover:bg-cit-forest-hover"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="rounded-md bg-cit-accent px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:bg-cit-accent-hover"
                    >
                      Registrarse
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
