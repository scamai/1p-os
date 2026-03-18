"use client";

interface TrapWarningProps {
  severity: "critical" | "warning" | "info";
  message: string;
  className?: string;
}

const severityStyles = {
  critical: "border-l-4 border-l-black bg-black/[0.02] p-4",
  warning: "border-l-[3px] border-l-black/50 bg-black/[0.02] p-4",
  info: "border-l-2 border-l-black/30 bg-black/[0.02] p-3",
};

const severityLabel = {
  critical: "Warning",
  warning: "Heads up",
  info: "Note",
};

export function TrapWarning({ severity, message, className = "" }: TrapWarningProps) {
  return (
    <div className={`${severityStyles[severity]} ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-black mb-1">
        {severityLabel[severity]}
      </p>
      <p className={`text-sm ${severity === "critical" ? "font-medium text-black" : "text-black/60"}`}>
        {message}
      </p>
    </div>
  );
}
