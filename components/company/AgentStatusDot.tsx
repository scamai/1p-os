type AgentStatus = "working" | "needs_input" | "idle" | "error" | "paused";

const statusColors: Record<AgentStatus, string> = {
  working: "bg-black",
  needs_input: "bg-black/40",
  idle: "bg-black/30",
  error: "bg-black/60",
  paused: "bg-black/60",
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
