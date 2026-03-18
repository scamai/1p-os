"use client";

import * as React from "react";

interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  detail: string | null;
  cost: number | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? events : events.slice(0, 8);

  return (
    <div className="flex flex-col">
      {visible.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-0"
        >
          {/* Dot */}
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-slate-700">
              <span className="font-medium text-slate-900">{event.actor}</span>
              {" "}
              {event.action}
            </p>
            {event.detail && (
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {event.detail}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex shrink-0 items-center gap-3">
            {event.cost != null && event.cost > 0 && (
              <span className="font-mono text-[11px] text-slate-400">
                ${event.cost.toFixed(3)}
              </span>
            )}
            <span className="text-[11px] text-slate-300">
              {timeAgo(event.createdAt)}
            </span>
          </div>
        </div>
      ))}

      {events.length > 8 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-[12px] text-slate-400 transition-colors hover:text-slate-600"
        >
          {expanded ? "Show less" : `Show all ${events.length} events`}
        </button>
      )}
    </div>
  );
}

export { ActivityTimeline };
export type { ActivityEvent };
