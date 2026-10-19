import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * Acceso al estado de sesión.
 *
 * Vive en su propio archivo para que `AuthContext.tsx` exporte solo componentes
 * (regla `react/only-export-components`).
 */
export const useAuth = (): AuthContextValue => {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }

  return contexto;
};
