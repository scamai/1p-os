"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ completed, total, className = "" }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-1.5 flex-1 bg-slate-100">
        <div
          className="h-full bg-slate-900 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">
        {percentage}%
      </span>
    </div>
  );
}
