import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onClose: () => void;
}

const TOAST_CLASSES: Record<ToastVariant, string> = {
  success:
    "border-cit-accent/60 bg-gh-surface text-gh-text shadow-lg",
  error:
    "border-status-danger/60 bg-gh-surface text-gh-text shadow-lg",
  info:
    "border-status-info/60 bg-gh-surface text-gh-text shadow-lg",
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-cit-accent-emphasis",
  error: "text-status-danger",
  info: "text-status-info",
};

export function Toast({
  message,
  variant = "success",
  durationMs = 4500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!message || durationMs <= 0) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 right-4 z-50 max-w-sm md:bottom-6"
    >
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TOAST_CLASSES[variant]}`}
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 text-base font-bold ${ICON_COLOR[variant]}`}
        >
          {variant === "success" ? "✓" : variant === "error" ? "!" : "i"}
        </span>
        <p className="flex-1 text-xs leading-relaxed text-gh-text">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación emergente"
          className="rounded p-0.5 text-gh-muted hover:bg-gh-elevated hover:text-gh-text"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
