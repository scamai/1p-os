"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";

interface AuditEntry {
  id: string;
  action: string;
  agentName: string;
  details: string;
  createdAt: string;
  category: string;
}

const categories = ["all", "decision", "cost", "agent", "safety", "general"];

function HistoryView({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const filtered = entries.filter((e) => {
    const matchesCategory = filter === "all" || e.category === filter;
    const matchesSearch =
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.agentName.toLowerCase().includes(search.toLowerCase()) ||
      e.details.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        History
      </h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit log..."
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                filter === cat
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No audit entries found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {entry.action}
                  </span>
                  <Badge variant="outline">{entry.category}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {entry.agentName} &middot; {entry.details}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { HistoryView };
