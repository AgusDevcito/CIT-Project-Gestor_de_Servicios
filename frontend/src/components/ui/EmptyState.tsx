import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gh-border bg-gh-surface/60 px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-gh-border bg-gh-elevated text-gh-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gh-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-gh-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
