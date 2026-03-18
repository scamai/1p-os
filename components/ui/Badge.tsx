import * as React from "react";

const variants = {
  default:
    "bg-black/[0.04] text-black/70",
  accent:
    "bg-black/[0.04] text-black/70",
  success:
    "bg-emerald-50 text-emerald-700",
  warning:
    "bg-amber-50 text-amber-700",
  destructive:
    "bg-red-50 text-red-700",
  outline:
    "border border-black/[0.06] text-black/60 bg-transparent",
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
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
