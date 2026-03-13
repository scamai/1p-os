type AgentStatus = "working" | "needs_input" | "idle" | "error" | "paused";

const statusColors: Record<AgentStatus, string> = {
  working: "bg-zinc-900",
  needs_input: "bg-zinc-400",
  idle: "bg-zinc-300",
  error: "bg-zinc-600",
  paused: "bg-zinc-600",
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
