/**
 * Roles de usuario. Espejo de `backend/src/constants/roles.ts`.
 * El rol lo decide el backend; el frontend solo lo lee para condicionar la UI.
 */

export const ROL = {
  USER: "user",
  CIT: "cit",
  ADMIN: "admin",
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

export const ROLES: readonly Rol[] = [ROL.USER, ROL.CIT, ROL.ADMIN];

export const esRol = (valor: unknown): valor is Rol =>
  typeof valor === "string" && (ROLES as readonly string[]).includes(valor);

/** Roles con permisos de gestión técnica (personal CIT y administradores). */
export const esPersonalCIT = (rol: Rol | undefined): boolean =>
  rol === ROL.CIT || rol === ROL.ADMIN;

const LABELS: Record<Rol, string> = {
  [ROL.USER]: "Usuario",
  [ROL.CIT]: "Personal CIT",
  [ROL.ADMIN]: "Administrador",
};

export const labelDeRol = (rol: Rol | undefined): string =>
  rol ? LABELS[rol] : "Desconocido";
