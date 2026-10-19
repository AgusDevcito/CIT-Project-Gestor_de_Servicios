import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext, type EstadoSesion } from "./auth-context";
import { registrarManejadorNoAutorizado, quitarManejadorNoAutorizado } from "../lib/http";
import * as authService from "../services/auth.service";
import type { UsuarioAutenticado } from "../domain/entidades";

/** Rutas accesibles sin sesión. */
const RUTAS_PUBLICAS = ["/login", "/register"] as const;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [status, setStatus] = useState<EstadoSesion>("cargando");
  const navigate = useNavigate();

  /**
   * Cierra la sesión y vuelve al login.
   *
   * Se invoca cuando el backend responde 401 en una petición autenticada
   * (token expirado o invalidado). No redirige si ya estamos en una ruta
   * pública, para no interrumpir un intento de login o de registro.
   */
  const cerrarSesion = useCallback(() => {
    setUser(null);
    setStatus("anonimo");

    const rutaActual = window.location.pathname;
    if (!RUTAS_PUBLICAS.some((ruta) => rutaActual.startsWith(ruta))) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* El backend puede responder 401 en cualquier momento: nos suscribimos. */
  useEffect(() => {
    registrarManejadorNoAutorizado(cerrarSesion);
    return () => quitarManejadorNoAutorizado();
  }, [cerrarSesion]);

  /** Restaura la sesión al cargar la aplicación. */
  const refresh = useCallback(async () => {
    try {
      const usuario = await authService.getSession();
      setUser(usuario);
      setStatus(usuario ? "autenticado" : "anonimo");
    } catch {
      setUser(null);
      setStatus("anonimo");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const usuario = await authService.login(username, password);
    setUser(usuario);
    setStatus("autenticado");
    return usuario;
  }, []);

  const register = useCallback(async (formData: FormData) => {
    return authService.register(formData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("anonimo");
    navigate("/login", { replace: true });
  }, [navigate]);

  const valor = useMemo(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
