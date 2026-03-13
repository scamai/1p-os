type AgentStatus = "working" | "needs_input" | "idle" | "error" | "paused";

const statusColors: Record<AgentStatus, string> = {
  working: "bg-[var(--success)]",
  needs_input: "bg-[var(--warning)]",
  idle: "bg-gray-500",
  error: "bg-[var(--destructive)]",
  paused: "bg-[var(--destructive)]",
};

interface AgentStatusDotProps {
  status: AgentStatus;
  className?: string;
}

function AgentStatusDot({ status, className = "" }: AgentStatusDotProps) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${statusColors[status]} ${
        status === "working" ? "animate-pulse" : ""
      } ${className}`}
      title={status.replace("_", " ")}
    />
  );
}

export { AgentStatusDot };
export type { AgentStatus };
