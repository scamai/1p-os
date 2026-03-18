"use client";

import * as React from "react";
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
  onDelete?: (agentId: string) => void;
  onHireAgent?: () => void;
}

function AgentGrid({ agents, onSelect, onDelete, onHireAgent }: AgentGridProps) {
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-slate-500">
          No agents yet. Hire your first agent to get started.
        </p>
        {onHireAgent && (
          <button
            onClick={onHireAgent}
            className="text-sm text-slate-900 hover:underline"
          >
            + Hire Agent
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-md"
          onClick={() => onSelect(agent.id)}
        >
          {/* Delete button — visible on hover */}
          {onDelete && confirmId !== agent.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmId(agent.id);
              }}
              className="absolute right-3 top-3 hidden rounded p-1 text-slate-400 transition-colors hover:text-slate-700 group-hover:block"
              aria-label={`Delete ${agent.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}

          {/* Confirm delete inline */}
          {confirmId === agent.id && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-lg bg-white/95"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-slate-500">Delete {agent.name}?</span>
              <button
                onClick={() => setConfirmId(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete?.(agent.id); setConfirmId(null); }}
                className="text-xs font-medium text-slate-900 hover:underline"
              >
                Delete
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {agent.initial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {agent.name}
                </h3>
                <AgentStatusDot status={agent.status} />
              </div>
              <span className="inline-block mt-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {agent.role}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span>{agent.tasksCompleted} tasks</span>
            <span>${agent.costToday.toFixed(2)} today</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export { AgentGrid };
export type { AgentGridItem };
