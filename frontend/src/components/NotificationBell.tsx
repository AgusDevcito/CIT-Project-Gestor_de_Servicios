import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getNotificaciones } from "../services/notificacionesService";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    Promise.resolve(getNotificaciones({ limit: 10 }))
      .then((res) => {
        if (active && res && typeof res.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {
        // Silencioso en caso de pruebas unitarias sin mock o modo offline
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      to="/notificaciones"
      aria-label="Ir a Notificaciones"
      title={
        unreadCount > 0
          ? `Notificaciones (${unreadCount} sin leer)`
          : "Centro de Notificaciones"
      }
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-cit-forest-border/50 bg-cit-forest-raised text-gh-text transition-colors hover:border-cit-accent-emphasis hover:bg-cit-forest-hover hover:text-white"
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
      </svg>

      {unreadCount > 0 && (
        <span
          data-testid="notification-bell-badge"
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cit-accent px-1 text-[10px] font-bold leading-none text-white shadow-xs"
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
}
