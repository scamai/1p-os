import * as React from "react";

const variants = {
  default:
    "bg-slate-100 text-slate-700",
  accent:
    "bg-indigo-50 text-indigo-700",
  success:
    "bg-emerald-50 text-emerald-700",
  warning:
    "bg-amber-50 text-amber-700",
  destructive:
    "bg-red-50 text-red-700",
  outline:
    "border border-slate-200 text-slate-600 bg-transparent",
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
