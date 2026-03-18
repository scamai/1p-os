"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

interface Investor {
  id: string;
  name: string;
  firm: string | null;
  check_size_min: number | null;
  check_size_max: number | null;
  stage: string | null;
  sectors: string[] | null;
  location: string | null;
  website: string | null;
  is_active: boolean;
}

interface Tracking {
  id: string;
  user_id: string;
  investor_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InvestorBrowserProps {
  investors: Investor[];
  tracking: Tracking[];
}

const STAGES = ["pre_seed", "seed"] as const;
const STATUSES = [
  "researching",
  "contacted",
  "pitched",
  "committed",
  "passed",
  "ghosted",
] as const;

function formatCurrency(amount: number | null): string {
  if (amount == null) return "--";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatStage(stage: string | null): string {
  if (!stage) return "--";
  return stage.replace(/_/g, "-");
}

export function InvestorBrowser({ investors, tracking: initialTracking }: InvestorBrowserProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Tracking[]>(initialTracking);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const trackedIds = useMemo(
    () => new Set(tracking.map((t) => t.investor_id)),
    [tracking]
  );

  const filtered = useMemo(() => {
    return investors.filter((inv) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        (inv.firm && inv.firm.toLowerCase().includes(q));
      const matchesStage = !stageFilter || inv.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [investors, search, stageFilter]);

  const pipeline = useMemo(() => {
    const grouped: Record<string, (Tracking & { investor: Investor | undefined })[]> = {};
    for (const status of STATUSES) {
      grouped[status] = [];
    }
    for (const t of tracking) {
      const inv = investors.find((i) => i.id === t.investor_id);
      if (!grouped[t.status]) grouped[t.status] = [];
      grouped[t.status].push({ ...t, investor: inv });
    }
    return grouped;
  }, [tracking, investors]);

  const hasTracked = tracking.length > 0;

  async function handleTrack(investorId: string) {
    setLoadingId(investorId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_investor_tracking")
        .insert({ investor_id: investorId, status: "researching" })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTracking((prev) => [...prev, data as Tracking]);
      }
    } catch {
      // Silently handle -- user can retry
    } finally {
      setLoadingId(null);
    }
  }

  async function handleStatusChange(trackingId: string, newStatus: string) {
    setUpdatingId(trackingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_investor_tracking")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", trackingId);

      if (error) throw error;
      setTracking((prev) =>
        prev.map((t) => (t.id === trackingId ? { ...t, status: newStatus } : t))
      );
    } catch {
      // Silently handle
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-base font-semibold text-slate-900">
          Investor Database
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Search investors and build your fundraising pipeline
        </p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name or firm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs text-slate-500">Stage:</span>
        <button
          onClick={() => setStageFilter(null)}
          className={`px-2 py-1 text-xs font-medium transition-colors duration-150 ${
            !stageFilter
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stageFilter === stage ? null : stage)}
            className={`px-2 py-1 text-xs font-medium transition-colors duration-150 ${
              stageFilter === stage
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {formatStage(stage)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Name
              </th>
              <th className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Firm
              </th>
              <th className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Check Size
              </th>
              <th className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Stage
              </th>
              <th className="px-4 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Location
              </th>
              <th className="px-4 py-2 text-right font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-slate-500">
                  {search
                    ? "No investors match your search"
                    : "No investors available"}
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {inv.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {inv.firm || "--"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">
                    {formatCurrency(inv.check_size_min)}
                    {inv.check_size_max ? ` - ${formatCurrency(inv.check_size_max)}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {inv.stage ? (
                      <Badge variant="outline">{formatStage(inv.stage)}</Badge>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {inv.location || "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trackedIds.has(inv.id) ? (
                      <Badge variant="success">Tracked</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={loadingId === inv.id}
                        onClick={() => handleTrack(inv.id)}
                      >
                        Track
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Your Pipeline
        </h2>

        {!hasTracked ? (
          <div className="flex items-center justify-center border border-slate-200 px-4 py-12">
            <p className="text-[13px] text-slate-500">
              Search investors above to start building your pipeline
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {STATUSES.map((status) => {
              const items = pipeline[status];
              if (!items || items.length === 0) return null;
              return (
                <div key={status}>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                    {status.replace(/_/g, " ")} ({items.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item.investor?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.investor?.firm || "--"}
                            </p>
                          </div>
                          <select
                            value={item.status}
                            disabled={updatingId === item.id}
                            onChange={(e) =>
                              handleStatusChange(item.id, e.target.value)
                            }
                            className="h-8 border border-slate-200 bg-white px-2 text-xs text-slate-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 disabled:opacity-50"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-12 text-xs text-slate-400 leading-relaxed">
        Investor data is sourced from public information. Always verify details
        before reaching out.
      </p>
    </div>
  );
}
