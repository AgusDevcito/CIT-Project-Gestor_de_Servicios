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
      className={`overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] text-[#e6edf3] ${className}`}
      {...rest}
    >
      {header && (
        <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-3">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && (
        <div className="border-t border-[#30363d] bg-[#0d1117]/40 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
