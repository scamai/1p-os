"use client";

import * as React from "react";
import type { ActivityEvent, ActivityEventType } from "@/lib/activity/feed";

// ── Color mapping by event type ──

const DOT_COLOR: Record<ActivityEventType, string> = {
  task_completed: "bg-emerald-500",
  decision_created: "bg-amber-400",
  goal_decomposed: "bg-blue-500",
  email_sent: "bg-violet-500",
  error: "bg-red-500",
  heartbeat_start: "bg-zinc-400",
  heartbeat_end: "bg-zinc-400",
};

const MAX_VISIBLE = 50;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

// ── Single feed entry ──

function FeedEntry({
  event,
  isNew,
}: {
  event: ActivityEvent;
  isNew: boolean;
}) {
  const dotColor = DOT_COLOR[event.type] ?? "bg-zinc-400";

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2 transition-all duration-500 ${
        isNew ? "animate-feed-in" : ""
      }`}
    >
      {/* Timestamp */}
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
        {formatTime(event.timestamp)}
      </span>

      {/* Type dot */}
      <span
        className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${dotColor}`}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span className="text-[13px]">
          <span className="font-semibold text-zinc-800">{event.agentName}</span>
          <span className="ml-1.5 text-zinc-600">{event.action}</span>
        </span>
        {event.detail && (
          <p className="mt-0.5 truncate text-[12px] text-zinc-400">
            {event.detail}
          </p>
        )}
      </div>

      {/* Cost */}
      {event.costUsd != null && event.costUsd > 0 && (
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
          {formatCost(event.costUsd)}
        </span>
      )}
    </div>
  );
}

// ── Live indicator ──

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">
        Live
      </span>
    </span>
  );
}

// ── Main component ──

function ActivityFeed() {
  const [events, setEvents] = React.useState<ActivityEvent[]>([]);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());
  const [connected, setConnected] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let es: EventSource | null = null;

    function connect() {
      es = new EventSource("/api/activity/stream");

      es.onopen = () => {
        setConnected(true);
      };

      es.onmessage = (msg) => {
        try {
          const event: ActivityEvent = JSON.parse(msg.data);
          setEvents((prev) => {
            const next = [event, ...prev];
            if (next.length > MAX_VISIBLE) next.length = MAX_VISIBLE;
            return next;
          });

          // Mark as new for animation
          setNewIds((prev) => {
            const next = new Set(prev);
            next.add(event.id);
            return next;
          });

          // Remove "new" status after animation completes
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(event.id);
              return next;
            });
          }, 600);
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        setConnected(false);
        es?.close();
        // Reconnect after a brief delay
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      es?.close();
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Activity
        </p>
        {connected && <LiveDot />}
      </div>

      {/* Feed container */}
      <div
        ref={containerRef}
        className="mt-3 max-h-[400px] overflow-y-auto rounded-lg border border-zinc-100"
      >
        {events.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-[13px] text-zinc-400">
              Waiting for agent activity...
            </p>
          </div>
        )}

        {events.map((event) => (
          <FeedEntry
            key={event.id}
            event={event}
            isNew={newIds.has(event.id)}
          />
        ))}
      </div>
    </div>
  );
}

export { ActivityFeed };
