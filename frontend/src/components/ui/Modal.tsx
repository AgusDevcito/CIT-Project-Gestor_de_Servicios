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
        className={`relative z-10 w-full ${maxWidthClass} overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] text-[#e6edf3] shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-3">
          <h2 id="modal-title" className="text-base font-semibold text-[#e6edf3]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-md p-1 text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#30363d] bg-[#0d1117]/50 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
