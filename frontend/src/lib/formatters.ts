/**
 * Utilidades de formateo para fechas, moneda e identidad visual de usuarios.
 */

export const formatearPrecio = (precio: number | string | null | undefined): string => {
  const valor = Number(precio);
  if (!Number.isFinite(valor) || valor <= 0) {
    return "Consultar";
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(valor);
};

export const formatearFecha = (
  fecha: string | Date | null | undefined,
  estilo: "short" | "medium" | "long" = "medium",
): string => {
  if (!fecha) return "—";
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", { dateStyle: estilo });
};

export const obtenerInicialesUsuario = (params: {
  nombre?: string | null;
  apellido?: string | null;
  username?: string | null;
}): string => {
  const nombre = params.nombre?.trim() ?? "";
  const apellido = params.apellido?.trim() ?? "";
  if (nombre && apellido) {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }
  if (nombre) {
    return nombre.slice(0, 2).toUpperCase();
  }
  const username = params.username?.trim() ?? "";
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return "U";
};

export const obtenerNombreVisible = (params: {
  nombre?: string | null;
  apellido?: string | null;
  username?: string | null;
}): string => {
  const completo = `${params.nombre ?? ""} ${params.apellido ?? ""}`.trim();
  if (completo) return completo;
  return params.username?.trim() || "Usuario";
};
