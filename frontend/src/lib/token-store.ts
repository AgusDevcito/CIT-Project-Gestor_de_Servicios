/**
 * Persistencia del token de sesión.
 *
 * El backend autentica con un JWT en el header `Authorization: Bearer <token>`
 * y **no** usa cookies, así que el frontend debe guardar el token y reenviarlo.
 *
 * El almacenamiento va detrás de una interfaz para que cambiar de mecanismo
 * (por ejemplo, a una cookie `HttpOnly` en el futuro) sea modificar un solo
 * módulo y no toda la aplicación.
 */

export interface TokenStore {
  leer(): string | null;
  guardar(token: string): void;
  limpiar(): void;
}

const CLAVE = "citio.token";

/**
 * Implementación sobre `localStorage`.
 *
 * Nota de seguridad: `localStorage` es accesible desde JavaScript, por lo que un
 * XSS podría leer el token. La alternativa más segura es la cookie `HttpOnly`,
 * que requeriría un cambio en el backend. Al estar encapsulado aquí, ese cambio
 * no obliga a refactorizar la aplicación.
 */
export const tokenStoreLocalStorage: TokenStore = {
  leer(): string | null {
    try {
      return window.localStorage.getItem(CLAVE);
    } catch {
      // Modo privado o almacenamiento bloqueado.
      return null;
    }
  },

  guardar(token: string): void {
    try {
      window.localStorage.setItem(CLAVE, token);
    } catch {
      // Si no se puede persistir, la sesión vive solo en esta pestaña.
    }
  },

  limpiar(): void {
    try {
      window.localStorage.removeItem(CLAVE);
    } catch {
      // Ignorado a propósito.
    }
  },
};

/** Implementación en memoria: útil para tests y para entornos sin storage. */
export const crearTokenStoreEnMemoria = (tokenInicial: string | null = null): TokenStore => {
  let token = tokenInicial;
  return {
    leer: () => token,
    guardar: (valor: string) => {
      token = valor;
    },
    limpiar: () => {
      token = null;
    },
  };
};

/** Store activo de la aplicación. */
export const tokenStore: TokenStore = tokenStoreLocalStorage;
