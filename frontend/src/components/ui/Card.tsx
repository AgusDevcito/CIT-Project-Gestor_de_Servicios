import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
  children: ReactNode;
}

export function Card({
  header,
  footer,
  noPadding = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gh-border bg-gh-surface text-gh-text ${className}`}
      {...rest}
    >
      {header && (
        <div className="border-b border-gh-border bg-gh-surface px-4 py-3">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && (
        <div className="border-t border-gh-border bg-gh-canvas/40 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
