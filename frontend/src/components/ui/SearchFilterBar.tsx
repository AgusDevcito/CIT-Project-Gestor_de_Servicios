import type { ReactNode } from "react";

export interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  children,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#30363d] bg-[#161b22] p-3">
      <div className="relative min-w-[220px] flex-1">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]"
        >
          <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] py-1.5 pl-9 pr-8 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none transition-colors focus:border-[#3fb950] focus:ring-2 focus:ring-[#2ea043]/20"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
          >
            ✕
          </button>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
