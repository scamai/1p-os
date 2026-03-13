import * as React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <span
        className="h-1 w-1 rounded-full flex-shrink-0 bg-zinc-900"
      />
      <span
        className="text-xs text-zinc-500"
      >
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </span>
    </span>
  );
}

export { StatusBadge };
