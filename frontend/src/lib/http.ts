/**
 * Cliente HTTP único de la aplicación.
 *
 * Mecanismo de autenticación (según `backend/src/middlewares/auth.middleware.ts`):
 * el backend lee **exclusivamente** el header `Authorization: Bearer <jwt>`.
 * No usa cookies, por lo que el token se guarda en el cliente y se inyecta
 * automáticamente en cada petición mediante un interceptor.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "./env";
import { tokenStore } from "./token-store";

/** Rutas de acceso público: no llevan token y su 401 no significa "sesión expirada". */
const RUTAS_PUBLICAS = ["/login", "/register"] as const;

const esRutaPublica = (url: string | undefined): boolean => {
  if (!url) return false;
  return RUTAS_PUBLICAS.some((ruta) => url.includes(ruta));
};

export const http = axios.create({
  baseURL: env.apiUrl,
  // `withCredentials` queda en false: la autenticación viaja en el header, no en cookies.
  withCredentials: false,
});

/* ------------------------------------------------------------------ */
/* Request: inyectar el token                                          */
/* ------------------------------------------------------------------ */

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.leer();

  if (token && !esRutaPublica(config.url)) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

/* ------------------------------------------------------------------ */
/* Response: sesión expirada                                           */
/* ------------------------------------------------------------------ */

type ManejadorNoAutorizado = () => void;

let manejadorNoAutorizado: ManejadorNoAutorizado | null = null;

/**
 * Registra el callback que se dispara cuando el backend responde 401 en una
 * petición autenticada.
 *
 * Se registra desde el `AuthContext` (no desde un evento global del `window`)
 * para que la dependencia sea explícita, tipada y testeable.
 */
export const registrarManejadorNoAutorizado = (manejador: ManejadorNoAutorizado): void => {
  manejadorNoAutorizado = manejador;
};

export const quitarManejadorNoAutorizado = (): void => {
  manejadorNoAutorizado = null;
};

const esErrorDeAxios = (error: unknown): error is AxiosError =>
  axios.isAxiosError(error);

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (esErrorDeAxios(error)) {
      const estado = error.response?.status;
      const url = error.config?.url;

      // 401 en una ruta pública = credenciales incorrectas: lo muestra la UI del
      // login, no es una sesión expirada.
      if (estado === 401 && !esRutaPublica(url)) {
        tokenStore.limpiar();
        manejadorNoAutorizado?.();
      }
    }

    return Promise.reject(error);
  },
);
