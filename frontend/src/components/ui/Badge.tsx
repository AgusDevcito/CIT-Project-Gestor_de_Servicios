import type { HTMLAttributes, ReactNode } from "react";
import type { Rol } from "../../domain/roles";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    "bg-gh-elevated text-gh-text border-gh-border",
  success:
    "bg-cit-accent/20 text-cit-accent-emphasis border-cit-accent/50",
  warning:
    "bg-status-warning-emphasis/20 text-status-warning border-status-warning-emphasis/50",
  danger:
    "bg-status-danger-emphasis/20 text-status-danger border-status-danger-emphasis/50",
  info:
    "bg-status-info-emphasis/20 text-status-info border-status-info-emphasis/50",
  purple:
    "bg-status-purple-emphasis/20 text-status-purple border-status-purple-emphasis/50",
};

export const badgeVariantPorEstado = (codigo?: string | null): BadgeVariant => {
  const upper = (codigo ?? "").toUpperCase();
  if (upper === "PENDIENTE" || upper === "EN_REVISION") return "warning";
  if (upper === "APROBADO" || upper === "ACEPTADA" || upper === "FINALIZADA") {
    return "success";
  }
  if (
    upper === "RECHAZADO" ||
    upper === "RECHAZADA" ||
    upper === "CANCELADO" ||
    upper === "CANCELADA"
  ) {
    return "danger";
  }
  return "neutral";
};

export const badgeVariantPorRol = (rol?: Rol | null): BadgeVariant => {
  if (rol === "admin") return "purple";
  if (rol === "cit") return "success";
  return "info";
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
