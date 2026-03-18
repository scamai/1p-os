"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { AgentStatusDot, type AgentStatus } from "@/components/company/AgentStatusDot";
import { AgentStats } from "@/components/team/AgentStats";

interface AgentDetailProps {
  agent: {
    id: string;
    name: string;
    role: string;
    level: string;
    initial: string;
    status: AgentStatus;
    tasksCompleted: number;
    hoursSaved: number;
    costTotal: number;
    decisionsEscalated: number;
    approvalRate: number;
    activityLog: string[];
  };
  onClose: () => void;
  onChat: (agentId: string) => void;
  onTogglePause: (agentId: string) => void;
  onDelete?: (agentId: string) => void;
}

function AgentDetail({
  agent,
  onClose,
  onChat,
  onTogglePause,
  onDelete,
}: AgentDetailProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const isPaused = agent.status === "paused";

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
            {agent.initial}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {agent.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <AgentStatusDot status={agent.status} />
              <span className="text-xs text-slate-500">
                {agent.role} &middot; {agent.level}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-slate-500 hover:text-slate-900"
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
        <AgentStats
          tasksCompleted={agent.tasksCompleted}
          hoursSaved={agent.hoursSaved}
          costTotal={agent.costTotal}
          decisionsEscalated={agent.decisionsEscalated}
          approvalRate={agent.approvalRate}
        />

        <div className="mt-6">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Recent Activity
          </h4>
          {agent.activityLog.length === 0 ? (
            <p className="text-xs text-slate-500">
              No recent activity.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {agent.activityLog.map((entry, i) => (
                <p key={i} className="text-xs text-slate-500">
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onChat(agent.id)}
          >
            Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onTogglePause(agent.id)}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
        {confirmDelete ? (
          <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-500">Delete {agent.name}?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete?.(agent.id)}
                className="text-xs text-slate-900 hover:underline"
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-3 text-xs text-slate-600 transition-colors hover:text-slate-500"
          >
            Delete Agent
          </button>
        )}
      </div>
    </div>
  );
}

export { AgentDetail };
