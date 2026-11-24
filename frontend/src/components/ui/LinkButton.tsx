import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

import type { ButtonSize, ButtonVariant } from "./Button";

export interface LinkButtonProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-cit-accent text-white border border-[rgba(240,246,252,0.1)] hover:bg-cit-accent-hover",
  secondary:
    "bg-gh-elevated text-gh-text border border-gh-border hover:bg-gh-border hover:border-gh-muted",
  danger:
    "bg-gh-elevated text-status-danger border border-gh-border hover:bg-status-danger-emphasis hover:text-white hover:border-status-danger",
  ghost:
    "bg-transparent text-gh-muted border border-transparent hover:bg-gh-elevated hover:text-gh-text",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs rounded-md gap-1.5",
  md: "px-3.5 py-1.5 text-sm rounded-md gap-2",
  lg: "px-4 py-2 text-sm rounded-md gap-2",
};

/**
 * Enlace de react-router con la misma apariencia que `Button`.
 * Evita repetir clases a mano en cada página.
 */
export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center font-medium transition-colors ${
        fullWidth ? "w-full" : ""
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
