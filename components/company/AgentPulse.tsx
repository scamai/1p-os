"use client";

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "paused" | "error";
  currentTask: string | null;
}

const statusDot: Record<AgentStatus["status"], string> = {
  active: "bg-black",
  idle: "bg-black/30",
  paused: "bg-black/40",
  error: "bg-black/60",
};

const statusLabel: Record<AgentStatus["status"], string> = {
  active: "Working",
  idle: "Idle",
  paused: "Paused",
  error: "Error",
};

function AgentPulse({ agents }: { agents: AgentStatus[] }) {
  return (
    <div className="flex flex-col">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="flex items-center gap-3 border-b border-black/[0.04] py-2.5 last:border-0"
        >
          {/* Status dot */}
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]} ${
              agent.status === "active" ? "animate-pulse" : ""
            }`}
          />

          {/* Name */}
          <span className="w-28 shrink-0 text-[13px] font-medium text-black">
            {agent.name}
          </span>

          {/* Current task or status */}
          <span className="flex-1 truncate text-[12px] text-black/40">
            {agent.currentTask ?? statusLabel[agent.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

export { AgentPulse };
export type { AgentStatus };
