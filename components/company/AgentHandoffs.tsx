"use client";

import * as React from "react";
import type { AgentHandoff } from "@/lib/agents/collaboration";

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<AgentHandoff["status"], { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-zinc-100", text: "text-zinc-600" },
  accepted: { label: "Accepted", bg: "bg-zinc-100", text: "text-zinc-700" },
  completed: { label: "Done", bg: "bg-zinc-100", text: "text-zinc-700" },
};

const TYPE_LABEL: Record<AgentHandoff["type"], string> = {
  task: "Task",
  data: "Data",
  alert: "Alert",
  request: "Request",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentHandoffsProps {
  handoffs: AgentHandoff[];
}

function AgentHandoffs({ handoffs }: AgentHandoffsProps) {
  if (handoffs.length === 0) {
    return (
      <p className="py-3 text-[13px] text-zinc-400">
        No active handoffs between agents.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100">
      {handoffs.map((handoff) => {
        const style = STATUS_STYLE[handoff.status];

        return (
          <div key={handoff.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            {/* Flow: From → To */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* Agent flow */}
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="font-medium text-zinc-800">
                  {handoff.fromAgentName.replace(" Agent", "")}
                </span>
                <svg
                  className="h-3 w-3 shrink-0 text-zinc-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-zinc-800">
                  {handoff.toAgentName.replace(" Agent", "")}
                </span>
              </div>

              {/* Subject */}
              <p className="text-[13px] leading-snug text-zinc-600">
                {handoff.subject}
              </p>

              {/* Type tag */}
              <span className="mt-0.5 inline-block w-fit rounded border border-zinc-150 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {TYPE_LABEL[handoff.type]}
              </span>
            </div>

            {/* Status badge */}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { AgentHandoffs };
export type { AgentHandoffsProps };
