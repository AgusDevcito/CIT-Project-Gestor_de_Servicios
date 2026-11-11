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
    "border-[#f85149]/40 bg-[#da3633]/15 text-[#ff7b72]",
  success:
    "border-[#238636]/50 bg-[#238636]/15 text-[#3fb950]",
  warning:
    "border-[#9e6a03]/50 bg-[#9e6a03]/15 text-[#d29922]",
  info:
    "border-[#1f6feb]/50 bg-[#1f6feb]/15 text-[#58a6ff]",
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
