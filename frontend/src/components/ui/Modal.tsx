import { useEffect, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
      />
      <div
        className={`relative z-10 w-full ${maxWidthClass} overflow-hidden rounded-lg border border-gh-border bg-gh-surface text-gh-text shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-gh-border px-4 py-3">
          <h2 id="modal-title" className="text-base font-semibold text-gh-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-md p-1 text-gh-muted hover:bg-gh-elevated hover:text-gh-text"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gh-border bg-gh-canvas/50 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
