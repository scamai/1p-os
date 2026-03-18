"use client";

import * as React from "react";
import type { MorningBrief } from "@/lib/orchestration/morning-brief";

// ── Skeleton ──

function BriefSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-40 rounded bg-zinc-100" />
      <div className="h-4 w-full rounded bg-zinc-100" />
      <div className="h-4 w-3/4 rounded bg-zinc-100" />
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-12 rounded bg-zinc-100" />
            <div className="h-6 w-8 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Cell ──

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}

// ── Alert Banner ──

const ALERT_STYLES: Record<
  "overdue" | "budget" | "error",
  { border: string; bg: string; text: string; label: string }
> = {
  overdue: {
    border: "border-zinc-200",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    label: "Overdue",
  },
  budget: {
    border: "border-zinc-200",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    label: "Budget",
  },
  error: {
    border: "border-zinc-200",
    bg: "bg-zinc-200",
    text: "text-zinc-800",
    label: "Error",
  },
};

function AlertBanner({
  alert,
}: {
  alert: MorningBrief["alerts"][number];
}) {
  const style = ALERT_STYLES[alert.type];
  return (
    <div
      className={`rounded-md border px-3 py-2 ${style.border} ${style.bg}`}
    >
      <p className={`text-[13px] ${style.text}`}>
        <span className="mr-1.5 font-semibold">{style.label}:</span>
        {alert.message}
      </p>
    </div>
  );
}

// ── Main Component ──

function MorningBriefCard() {
  const [brief, setBrief] = React.useState<MorningBrief | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/orchestration/brief")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch brief");
        return r.json();
      })
      .then((data: MorningBrief) => {
        setBrief(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      {/* Header with dismiss */}
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Morning Brief
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-sm p-1 text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <svg
            width="12"
            height="12"
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

      {loading && <BriefSkeleton />}

      {error && (
        <p className="mt-3 text-[13px] text-zinc-500">
          Failed to load. Try refreshing.
        </p>
      )}

      {brief && !loading && !error && (
        <div className="mt-3 space-y-5">
          {/* Greeting & Summary */}
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900">
              {brief.greeting}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
              {brief.summary}
            </p>
          </div>

          {/* Stats Grid: 2x3 */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-6">
            <StatCell label="Done overnight" value={brief.stats.tasksCompletedOvernight} />
            <StatCell label="Pending" value={brief.stats.decisionsPending} />
            <StatCell
              label="Cost yesterday"
              value={`$${brief.stats.costYesterday.toFixed(2)}`}
            />
            <StatCell label="Agents active" value={brief.stats.agentsActive} />
            <StatCell label="Goals done" value={brief.stats.goalsCompleted} />
            <StatCell label="Blocked" value={brief.stats.goalsBlocked} />
          </div>

          {/* Alerts */}
          {brief.alerts.length > 0 && (
            <div className="space-y-2">
              {brief.alerts.map((alert, i) => (
                <AlertBanner key={i} alert={alert} />
              ))}
            </div>
          )}

          {/* Highlights: What happened */}
          {brief.highlights.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                What happened
              </p>
              <ul className="space-y-1.5">
                {brief.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="shrink-0 font-medium text-zinc-700">
                      {h.agent}
                    </span>
                    <span className="text-zinc-500">{h.action}</span>
                    <span className="ml-auto shrink-0 text-[11px] font-medium text-zinc-400">
                      {h.impact}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Actions */}
          {brief.suggestedActions.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Suggested next
              </p>
              <div className="flex flex-wrap gap-2">
                {brief.suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { MorningBriefCard };
