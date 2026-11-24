import type { ReactNode } from "react";
import { Badge } from "./Badge";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  /** Texto accesible del contador (por defecto "Total"). */
  countLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  count,
  countLabel = "Total",
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gh-border pb-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gh-text">
            {title}
          </h1>
          {typeof count === "number" && (
            <Badge variant="neutral" aria-label={`${countLabel}: ${count}`}>
              {count}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-gh-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
