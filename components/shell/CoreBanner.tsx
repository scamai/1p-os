"use client";

import * as React from "react";

interface Insight {
  id: string;
  type: "alert" | "suggestion" | "metric" | "status";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  action?: {
    id: string;
    label: string;
    params: Record<string, unknown>;
  };
  section: string;
}

interface CoreBannerProps {
  section: string;
  onAction?: (action: string, params?: Record<string, unknown>) => void;
}

function CoreBanner({ section, onAction }: CoreBannerProps) {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [status, setStatus] = React.useState<{
    health: number;
    alerts: number;
    summary: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      setLoading(true);
      try {
        const res = await fetch(`/api/core?section=${encodeURIComponent(section)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setInsights(data.insights ?? []);
          setStatus(data.status ?? null);
        }
      } catch {
        // Silently fail — the banner is supplementary
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [section]);

  const handleAction = (insight: Insight) => {
    if (!insight.action || !onAction) return;

    if (insight.action.id === "navigate") {
      onAction("navigate", insight.action.params);
    } else {
      onAction(insight.action.id, insight.action.params);
    }
  };

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleInsights = insights.filter(
    (i) => !dismissed.has(i.id) && (section === "all" || i.section === section || i.section === "hq")
  );

  // Don't render if no insights
  if (loading || visibleInsights.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {/* Status line */}
      {status && status.alerts > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-black" />
          <span className="text-xs text-black/60">{status.summary}</span>
        </div>
      )}

      {/* Insight cards */}
      {visibleInsights.slice(0, 3).map((insight) => (
        <div
          key={insight.id}
          className={`flex items-start justify-between rounded-lg border px-4 py-3 ${
            insight.priority === "high"
              ? "border-black/30 bg-black/[0.02]"
              : "border-black/[0.08] bg-white"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                insight.type === "alert"
                  ? "bg-black"
                  : insight.type === "suggestion"
                    ? "bg-black/50"
                    : "bg-black/30"
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-black">{insight.title}</p>
              <p className="mt-0.5 text-xs text-black/50 truncate">{insight.detail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {insight.action && onAction && (
              <button
                onClick={() => handleAction(insight)}
                className="text-xs font-medium text-black hover:text-black/60 transition-colors"
              >
                {insight.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(insight.id)}
              className="text-black/30 hover:text-black/50 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export { CoreBanner };
export type { CoreBannerProps };
