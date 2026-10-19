import { createContext } from "react";

import type { UsuarioAutenticado } from "../domain/entidades";

/**
 * Estados posibles de la sesión.
 *
 * Se usa un discriminante en lugar de varios booleanos (`user` + `loading`)
 * porque la combinación de ambos permite estados imposibles y obliga a
 * condicionales ambiguos en cada página.
 */
export type EstadoSesion = "cargando" | "autenticado" | "anonimo";

export interface AuthContextValue {
  user: UsuarioAutenticado | null;
  status: EstadoSesion;
  login: (username: string, password: string) => Promise<UsuarioAutenticado>;
  register: (formData: FormData) => Promise<{ mensaje: string; documentUrl: string | null }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
