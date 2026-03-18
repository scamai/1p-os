"use client";

import * as React from "react";
import { AgentStatusDot, type AgentStatus } from "@/components/company/AgentStatusDot";

interface AgentSidebarAgent {
  id: string;
  name: string;
  initial: string;
  status: AgentStatus;
  activityLog?: string[];
}

interface AgentSidebarProps {
  agents: AgentSidebarAgent[];
}

function AgentSidebar({ agents }: AgentSidebarProps) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const selectedAgent = agents.find((a) => a.id === selected);

  return (
    <>
      <aside className="flex w-14 flex-col items-center gap-3 border-l border-black/[0.08] bg-white py-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelected(agent.id)}
            className="group relative flex flex-col items-center gap-0.5"
            title={agent.name}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-xs font-medium text-black transition-colors group-hover:bg-black/50/20">
              {agent.initial}
            </div>
            <AgentStatusDot status={agent.status} />
            <span className="hidden text-[10px] text-black/50 group-hover:block">
              {agent.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </aside>

      {selectedAgent && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-black/[0.08] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/[0.08] p-4">
            <div>
              <h3 className="text-sm font-semibold text-black">
                {selectedAgent.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <AgentStatusDot status={selectedAgent.status} />
                <span className="text-xs capitalize text-black/50">
                  {selectedAgent.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-sm p-1 text-black/50 hover:text-black"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-black/50">
              Activity
            </h4>
            {(!selectedAgent.activityLog ||
              selectedAgent.activityLog.length === 0) && (
              <p className="text-xs text-black/50">
                No recent activity.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {selectedAgent.activityLog?.map((entry, i) => (
                <p
                  key={i}
                  className="text-xs text-black/50"
                >
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { AgentSidebar };
export type { AgentSidebarAgent };
