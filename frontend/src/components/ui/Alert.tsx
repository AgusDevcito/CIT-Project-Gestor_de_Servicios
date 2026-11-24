import type { ReactNode } from "react";

export type AlertVariant = "error" | "success" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error:
    "border-status-danger/40 bg-status-danger-emphasis/15 text-status-danger",
  success:
    "border-cit-accent/50 bg-cit-accent/15 text-cit-accent-emphasis",
  warning:
    "border-status-warning-emphasis/50 bg-status-warning-emphasis/15 text-status-warning",
  info:
    "border-status-info-emphasis/50 bg-status-info-emphasis/15 text-status-info",
};

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className = "",
}: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded p-0.5 opacity-75 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
