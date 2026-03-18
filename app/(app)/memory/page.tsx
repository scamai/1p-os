"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemoryStats {
  totalMemories: number;
  byAgent: { agentId: string; agentName: string; count: number }[];
  byCategory: { category: string; count: number }[];
  timeline: { date: string; count: number }[];
  recentMemories: MemoryItem[];
  semantic: boolean;
}

interface MemoryItem {
  id: string;
  content: string;
  category: string;
  agentId: string;
  agentName: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Category colors
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  fact: "bg-slate-100 text-slate-700 border-slate-200",
  preference: "bg-slate-100 text-slate-700 border-slate-200",
  relationship: "bg-slate-100 text-slate-700 border-slate-200",
  event: "bg-slate-100 text-slate-700 border-slate-200",
  insight: "bg-slate-100 text-slate-700 border-slate-200",
  uncategorized: "bg-slate-50 text-slate-600 border-slate-200",
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  fact: "bg-slate-900",
  preference: "bg-slate-700",
  relationship: "bg-slate-600",
  event: "bg-slate-500",
  insight: "bg-slate-800",
  uncategorized: "bg-slate-400",
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = "overview" | "timeline" | "memories" | "search";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "memories", label: "All Memories" },
  { id: "search", label: "Search" },
];

const CATEGORIES = ["fact", "preference", "relationship", "event", "insight"] as const;

// ---------------------------------------------------------------------------
// Mini timeline chart (pure CSS)
// ---------------------------------------------------------------------------

function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-px" style={{ height: 120 }}>
      {data.map((d) => {
        const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
        return (
          <div key={d.date} className="group relative flex-1 flex flex-col items-center justify-end">
            <div
              className="w-full rounded-t bg-slate-900 transition-all hover:bg-slate-700"
              style={{ height: `${Math.max(height, 2)}%`, minHeight: d.count > 0 ? 4 : 1 }}
            />
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white shadow-lg">
                {d.date}: {d.count}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MemoryPage() {
  const [tab, setTab] = React.useState<Tab>("overview");
  const [stats, setStats] = React.useState<MemoryStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<MemoryItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [filterAgent, setFilterAgent] = React.useState<string>("all");

  // Add memory state
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addContent, setAddContent] = React.useState("");
  const [addCategory, setAddCategory] = React.useState<string>("fact");
  const [addImportance, setAddImportance] = React.useState(0.5);
  const [addSaving, setAddSaving] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Load stats on mount
  React.useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/memory/stats");
        if (!res.ok) throw new Error("Failed to load memory stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      // Search across all agents using the context memory endpoint
      const res = await fetch(
        `/api/context/memory?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(
        (data.memories ?? []).map(
          (m: Record<string, unknown>) => ({
            id: m.id as string,
            content: (m.value ?? m.content ?? "") as string,
            category: (m.category ?? "uncategorized") as string,
            agentId: (m.source_agent_id ?? "system") as string,
            agentName: (m.source_agent_id ?? "System") as string,
            importance: 0.5,
            createdAt: (m.updated_at ?? m.created_at ?? "") as string,
            updatedAt: (m.updated_at ?? "") as string,
          })
        )
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Reload stats
  const reloadStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/memory/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // best effort
    }
  }, []);

  // Add memory handler
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addContent.trim()) return;

    setAddSaving(true);
    setAddError(null);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "manual",
          content: addContent.trim(),
          category: addCategory,
          importance: addImportance,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save memory");
      }

      // Reset form and reload
      setAddContent("");
      setAddCategory("fact");
      setAddImportance(0.5);
      setShowAddForm(false);
      await reloadStats();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setAddSaving(false);
    }
  };

  // Delete memory handler
  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await reloadStats();
    } catch {
      // best effort
    }
  };

  // Filtered memories
  const filteredMemories = React.useMemo(() => {
    if (!stats) return [];
    return stats.recentMemories.filter((m) => {
      if (filterCategory !== "all" && m.category !== filterCategory) return false;
      if (filterAgent !== "all" && m.agentId !== filterAgent) return false;
      return true;
    });
  }, [stats, filterCategory, filterAgent]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-slate-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Memory</h1>
          <p className="text-sm text-slate-500">
            What your agents know — automatically extracted from every conversation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.semantic && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
              Semantic
            </span>
          )}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="h-8 rounded-md bg-slate-900 px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {showAddForm ? "Cancel" : "+ Add Memory"}
          </button>
        </div>
      </div>

      {/* Add memory form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <div>
            <label className="block text-[12px] font-medium text-slate-500 mb-1">
              Content
            </label>
            <textarea
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="What should your agents remember?"
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-slate-500 mb-1">
                Category
              </label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-[12px] font-medium text-slate-500 mb-1">
                Importance ({addImportance.toFixed(1)})
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={addImportance}
                onChange={(e) => setAddImportance(parseFloat(e.target.value))}
                className="w-full mt-1.5"
              />
            </div>
          </div>
          {addError && (
            <p className="text-[12px] text-slate-800">{addError}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addSaving || !addContent.trim()}
              className="h-8 rounded-md bg-slate-900 px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {addSaving ? "Saving..." : "Save Memory"}
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="mt-4 mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Total Memories
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {stats.totalMemories}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Agents
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {stats.byAgent.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Categories
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {stats.byCategory.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                By Category
              </p>
              <div className="space-y-2">
                {stats.byCategory
                  .sort((a, b) => b.count - a.count)
                  .map((cat) => (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="w-24 text-[13px] text-slate-600 capitalize">
                        {cat.category}
                      </span>
                      <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            CATEGORY_BAR_COLORS[cat.category] ?? "bg-slate-400"
                          }`}
                          style={{
                            width: `${Math.max(
                              (cat.count / Math.max(stats.totalMemories, 1)) * 100,
                              2,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-[13px] tabular-nums text-slate-500">
                        {cat.count}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent breakdown */}
          {stats.byAgent.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  By Agent
                </p>
                <div className="space-y-2">
                  {stats.byAgent
                    .sort((a, b) => b.count - a.count)
                    .map((agent) => (
                      <div key={agent.agentId} className="flex items-center justify-between py-1">
                        <span className="text-[13px] text-slate-700">
                          {agent.agentName}
                        </span>
                        <span className="text-[13px] tabular-nums text-slate-500">
                          {agent.count} memories
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent memories preview */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Recent Memories
            </p>
            <div className="space-y-1.5">
              {stats.recentMemories.slice(0, 5).map((m) => (
                <MemoryRow key={m.id} memory={m} onDelete={handleDelete} />
              ))}
              {stats.recentMemories.length > 5 && (
                <button
                  onClick={() => setTab("memories")}
                  className="mt-2 text-[12px] text-slate-500 hover:text-slate-700 transition-colors"
                >
                  View all {stats.totalMemories} memories
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline tab */}
      {tab === "timeline" && stats && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Memories Created — Last 30 Days
              </p>
              <TimelineChart data={stats.timeline} />
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                <span>{stats.timeline[0]?.date}</span>
                <span>{stats.timeline[stats.timeline.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>

          {/* Daily list */}
          <div className="space-y-4">
            {stats.timeline
              .filter((d) => d.count > 0)
              .reverse()
              .slice(0, 14)
              .map((day) => {
                const dayMemories = stats.recentMemories.filter(
                  (m) => m.createdAt?.split("T")[0] === day.date,
                );
                return (
                  <div key={day.date}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-700">
                        {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {day.count} memories
                      </span>
                    </div>
                    <div className="space-y-1 pl-3 border-l-2 border-slate-100">
                      {dayMemories.map((m) => (
                        <MemoryRow key={m.id} memory={m} compact />
                      ))}
                      {dayMemories.length === 0 && (
                        <p className="text-[12px] text-slate-400 italic py-1">
                          {day.count} memories (not in recent window)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* All memories tab */}
      {tab === "memories" && stats && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All categories</option>
              {stats.byCategory.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All agents</option>
              {stats.byAgent.map((a) => (
                <option key={a.agentId} value={a.agentId}>
                  {a.agentName} ({a.count})
                </option>
              ))}
            </select>
            <span className="ml-auto text-[12px] text-slate-400 self-center">
              {filteredMemories.length} of {stats.totalMemories}
            </span>
          </div>

          {/* Memory list */}
          <div className="space-y-1.5">
            {filteredMemories.map((m) => (
              <MemoryRow key={m.id} memory={m} onDelete={handleDelete} />
            ))}
            {filteredMemories.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No memories match the current filters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search tab */}
      {tab === "search" && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={stats?.semantic ? "Semantic search across all memories..." : "Search memories..."}
              className="h-9 flex-1 rounded-md border border-slate-200 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={searching}
              className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {searching && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {!searching && searched && searchResults.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No memories found for &quot;{searchQuery}&quot;.
            </p>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-1.5">
              {searchResults.map((m) => (
                <MemoryRow key={m.id} memory={m} />
              ))}
            </div>
          )}

          {!searched && !searching && (
            <p className="py-12 text-center text-sm text-slate-500">
              {stats?.semantic
                ? "Search uses vector similarity — try natural language queries."
                : "Search your business knowledge base."}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {stats && stats.totalMemories === 0 && tab === "overview" && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">
            No memories yet. Memories are automatically extracted when your agents
            have conversations or execute tasks.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemoryRow component
// ---------------------------------------------------------------------------

function MemoryRow({
  memory,
  compact = false,
  onDelete,
}: {
  memory: MemoryItem;
  compact?: boolean;
  onDelete?: (id: string) => void;
}) {
  const categoryStyle =
    CATEGORY_COLORS[memory.category] ?? CATEGORY_COLORS.uncategorized;

  return (
    <div
      className={`group rounded-lg border border-slate-100 bg-white transition-colors hover:bg-slate-50 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-slate-800 ${compact ? "text-[12px]" : "text-[13px]"}`}>
            {memory.content || "(empty)"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${categoryStyle}`}
            >
              {memory.category}
            </span>
            <span className="text-[11px] text-slate-400">
              {memory.agentName}
            </span>
            {!compact && memory.createdAt && (
              <span className="text-[11px] text-slate-400">
                {new Date(memory.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!compact && memory.importance > 0.7 && (
            <Badge variant="outline" className="text-[10px]">
              high
            </Badge>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(memory.id)}
              className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Delete memory"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
