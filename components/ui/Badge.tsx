import * as React from "react";

const variants = {
  default:
    "bg-[var(--muted)] text-[var(--foreground)]",
  success:
    "bg-[var(--success)]/15 text-[var(--success)]",
  warning:
    "bg-[var(--warning)]/15 text-[var(--warning)]",
  destructive:
    "bg-[var(--destructive)]/15 text-[var(--destructive)]",
  outline:
    "border border-[var(--border)] text-[var(--muted-foreground)] bg-transparent",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
