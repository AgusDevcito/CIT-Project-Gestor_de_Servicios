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
    "bg-[#21262d] text-[#e6edf3] border-[#30363d]",
  success:
    "bg-[#238636]/20 text-[#3fb950] border-[#238636]/50",
  warning:
    "bg-[#9e6a03]/20 text-[#d29922] border-[#9e6a03]/50",
  danger:
    "bg-[#da3633]/20 text-[#f85149] border-[#da3633]/50",
  info:
    "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50",
  purple:
    "bg-[#8957e5]/20 text-[#a371f7] border-[#8957e5]/50",
};

export const badgeVariantPorEstado = (codigo?: string | null): BadgeVariant => {
  const upper = (codigo ?? "").toUpperCase();
  if (upper === "PENDIENTE" || upper === "EN_REVISION") return "warning";
  if (upper === "APROBADO" || upper === "ACEPTADA" || upper === "FINALIZADA") {
    return "success";
  }
  if (upper === "RECHAZADO" || upper === "CANCELADO") return "danger";
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
