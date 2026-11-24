import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-cit-accent text-white border border-[rgba(240,246,252,0.1)] hover:bg-cit-accent-hover active:bg-cit-accent",
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

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  disabled,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cit-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
    </button>
  );
}
