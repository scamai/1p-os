"use client";

interface TrapWarningProps {
  severity: "critical" | "warning" | "info";
  message: string;
  className?: string;
}

const severityStyles = {
  critical: "border-l-4 border-l-slate-900 bg-slate-50 p-4",
  warning: "border-l-[3px] border-l-slate-500 bg-slate-50 p-4",
  info: "border-l-2 border-l-slate-300 bg-slate-50 p-3",
};

const severityLabel = {
  critical: "Warning",
  warning: "Heads up",
  info: "Note",
};

export function TrapWarning({ severity, message, className = "" }: TrapWarningProps) {
  return (
    <div className={`${severityStyles[severity]} ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-900 mb-1">
        {severityLabel[severity]}
      </p>
      <p className={`text-sm ${severity === "critical" ? "font-medium text-slate-900" : "text-slate-600"}`}>
        {message}
      </p>
    </div>
  );
}
