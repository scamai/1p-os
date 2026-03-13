import * as React from "react";

const variants = {
  default:
    "bg-zinc-50 text-zinc-900",
  success:
    "bg-zinc-100 text-zinc-700",
  warning:
    "bg-zinc-200 text-zinc-600",
  destructive:
    "bg-zinc-200 text-zinc-700",
  outline:
    "border border-zinc-200 text-zinc-500 bg-transparent",
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
