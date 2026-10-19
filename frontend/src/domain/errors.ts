/**
 * Errores de dominio.
 *
 * Traduce cualquier fallo (axios, backend, red) a un tipo propio con un
 * discriminante `tipo`, para que las páginas no tengan que conocer la forma
 * de la respuesta HTTP ni la de axios.
 */

export type TipoError =
  | "validacion"
  | "noAutorizado"
  | "prohibido"
  | "noEncontrado"
  | "conflicto"
  | "tamanoArchivo"
  | "red"
  | "desconocido";

export interface ErrorDominio {
  tipo: TipoError;
  /** Mensaje apto para mostrar al usuario. */
  mensaje: string;
  /** Código estable del backend (`VALIDATION_ERROR`, `UNAUTHORIZED`, ...). */
  codigo?: string;
  /** Código HTTP, si la respuesta llegó al servidor. */
  estado?: number;
}

const CODIGOS_A_TIPO: Record<string, TipoError> = {
  VALIDATION_ERROR: "validacion",
  DOCUMENT_REQUIRED: "validacion",
  UNAUTHORIZED: "noAutorizado",
  FORBIDDEN: "prohibido",
  NOT_FOUND: "noEncontrado",
  CONFLICT: "conflicto",
  CATALOG_NOT_SEEDED: "validacion",
};

const TIPO_POR_ESTADO: Record<number, TipoError> = {
  400: "validacion",
  401: "noAutorizado",
  403: "prohibido",
  404: "noEncontrado",
  409: "conflicto",
  413: "tamanoArchivo",
  500: "desconocido",
};

const MENSAJE_POR_ESTADO: Record<number, string> = {
  413: "El archivo supera el tamaño máximo permitido.",
};

interface RespuestaBackend {
  msg?: string;
  code?: string;
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null;

const obtenerRespuesta = (error: unknown): RespuestaBackend | null => {
  if (!esObjeto(error)) return null;
  const response = error.response;
  if (!esObjeto(response)) return null;
  const data = response.data;
  return esObjeto(data) ? (data as RespuestaBackend) : null;
};

const obtenerEstado = (error: unknown): number | undefined => {
  if (!esObjeto(error)) return undefined;
  const response = error.response;
  if (!esObjeto(response)) return undefined;
  const status = response.status;
  return typeof status === "number" ? status : undefined;
};

/**
 * Convierte cualquier error en un `ErrorDominio`.
 *
 * Cubre tres casos que la versión anterior no distinguía:
 *  - error del backend  -> usa `msg` y `code`
 *  - error de red        -> sin `response` (servidor caído, CORS, timeout)
 *  - error de validación local (formulario) -> `validacion`
 */
export const traducirError = (error: unknown): ErrorDominio => {
  // Error ya traducido.
  if (esObjeto(error) && typeof error.tipo === "string" && typeof error.mensaje === "string") {
    return error as unknown as ErrorDominio;
  }

  const respuesta = obtenerRespuesta(error);
  const estado = obtenerEstado(error);
  const codigo = respuesta?.code;
  const mensajeBackend = respuesta?.msg;

  if (codigo && codigo in CODIGOS_A_TIPO) {
    return {
      tipo: CODIGOS_A_TIPO[codigo]!,
      mensaje: mensajeBackend ?? "Ocurrió un error inesperado.",
      codigo,
      estado,
    };
  }

  if (estado !== undefined) {
    return {
      tipo: TIPO_POR_ESTADO[estado] ?? "desconocido",
      mensaje:
        mensajeBackend ??
        MENSAJE_POR_ESTADO[estado] ??
        "Ocurrió un error inesperado.",
      codigo,
      estado,
    };
  }

  // Sin `response`: la petición ni siquiera llegó al servidor.
  if (esObjeto(error) && typeof error.message === "string" && error.message.length > 0) {
    return {
      tipo: "red",
      mensaje: "No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.",
    };
  }

  return { tipo: "desconocido", mensaje: "Ocurrió un error inesperado." };
};

/** Atajo para mostrar el mensaje de un error en la UI. */
export const getApiError = (error: unknown, fallback = "Ocurrió un error inesperado."): string => {
  const traducido = traducirError(error);
  return traducido.mensaje || fallback;
};

/** Construye un error de dominio desde cero (validación de formulario). */
export const errorDeValidacion = (mensaje: string): ErrorDominio => ({
  tipo: "validacion",
  mensaje,
});
