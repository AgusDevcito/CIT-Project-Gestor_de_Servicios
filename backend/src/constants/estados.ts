export const ESTADO = {
    PENDIENTE: "PENDIENTE",
    APROBADO: "APROBADO",
    RECHAZADO: "RECHAZADO",
    ACEPTADA: "ACEPTADA",
    FINALIZADA: "FINALIZADA",
} as const;

export type EstadoCodigo = (typeof ESTADO)[keyof typeof ESTADO];

export const DECISIONES_PROPUESTA = {
    APROBADO: ESTADO.APROBADO,
    RECHAZADO: ESTADO.RECHAZADO,
} as const;
