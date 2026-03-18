import * as React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-16 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 text-zinc-600">{icon}</div>
      )}
      <p className="text-[13px] font-medium text-zinc-700">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] text-zinc-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-[13px] text-zinc-900 transition-colors duration-150 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
