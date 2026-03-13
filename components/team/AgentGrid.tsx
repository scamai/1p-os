"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { AgentStatusDot, type AgentStatus } from "@/components/company/AgentStatusDot";

interface AgentGridItem {
  id: string;
  name: string;
  role: string;
  initial: string;
  status: AgentStatus;
  tasksCompleted: number;
  costToday: number;
}

interface AgentGridProps {
  agents: AgentGridItem[];
  onSelect: (agentId: string) => void;
}

function AgentGrid({ agents, onSelect }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-[var(--muted-foreground)]">
          No agents yet. Visit the marketplace to hire your first agent.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className="cursor-pointer"
          onClick={() => onSelect(agent.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-medium text-[var(--foreground)]">
                {agent.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {agent.name}
                  </h3>
                  <AgentStatusDot status={agent.status} />
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {agent.role}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span>{agent.tasksCompleted} tasks</span>
              <span>${agent.costToday.toFixed(2)} today</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { AgentGrid };
export type { AgentGridItem };
