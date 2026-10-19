export const ROL = {
    USER: "user",
    CIT: "cit",
    ADMIN: "admin",
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

export const ROLES: readonly Rol[] = [ROL.USER, ROL.CIT, ROL.ADMIN];
