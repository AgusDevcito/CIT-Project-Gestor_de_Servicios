/**
 * Configuración tipada del entorno.
 *
 * `import.meta.env` es `any` por defecto; este módulo es el único lugar del
 * frontend donde se lee, de modo que la URL de la API queda en un solo punto.
 */

const leerViteEnv = (clave: string): string | undefined => {
  const valor = (import.meta.env as Record<string, string | undefined>)[clave];
  return typeof valor === "string" && valor.trim().length > 0 ? valor.trim() : undefined;
};

/** Quita la barra final para evitar `//api` al concatenar rutas. */
const normalizarBase = (url: string): string => url.replace(/\/+$/, "");

export const env = {
  apiUrl: normalizarBase(leerViteEnv("VITE_API_URL") ?? "http://localhost:3000/api"),
} as const;
