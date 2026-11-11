import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines = 1, className = "", ...rest }: SkeletonProps) {
  if (lines <= 1) {
    return (
      <div
        aria-hidden="true"
        className={`h-4 animate-pulse rounded bg-[#21262d] ${className}`}
        {...rest}
      />
    );
  }

  return (
    <div aria-hidden="true" className={`space-y-2.5 ${className}`} {...rest}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`h-4 animate-pulse rounded bg-[#21262d] ${
            idx === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
