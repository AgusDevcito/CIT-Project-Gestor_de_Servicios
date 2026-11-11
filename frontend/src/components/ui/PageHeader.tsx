import type { ReactNode } from "react";
import { Badge } from "./Badge";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, count, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#30363d] pb-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-[#e6edf3]">
            {title}
          </h1>
          {typeof count === "number" && (
            <Badge variant="neutral" aria-label={`Total: ${count}`}>
              {count}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-[#8b949e]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
