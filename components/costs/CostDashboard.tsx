"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CostByAgent } from "@/components/costs/CostByAgent";
import { CostTrend } from "@/components/costs/CostTrend";

type Period = "today" | "this_week" | "this_month";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
};

interface SummaryData {
  totalCost: number;
  budgetRemaining: number;
  projectedMonthlyCost: number;
  tokenCount: number;
  requestCount: number;
  tokensSaved: number;
  costSavedByEfficiency: number;
  efficiency: {
    tokensSavedByCache: number;
    tokensSavedByOptimization: number;
    tokensSaved: number;
    tasksDeduplicated: number;
    tasksBatched: number;
    costSavedByEfficiency: number;
  };
}

interface AgentData {
  agentId: string;
  name: string;
  role: string;
  cost: number;
  tasks: number;
  hoursSaved: number;
  efficiencyScore: number;
  dailyBudget: number;
  monthlyBudget: number;
}

interface TrendPoint {
  date: string;
  cost: number;
}

function CostDashboard() {
  const [period, setPeriod] = React.useState<Period>("today");
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [agents, setAgents] = React.useState<AgentData[]>([]);
  const [trendData, setTrendData] = React.useState<TrendPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [monthlyBudget, setMonthlyBudget] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const [summaryRes, agentRes] = await Promise.all([
          fetch(`/api/efficiency/cost?view=summary&period=${period}`),
          fetch(`/api/efficiency/cost?view=by-agent&period=${period}`),
        ]);

        if (cancelled) return;

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
          setMonthlyBudget(data.monthlyBudget ?? 0);

          // Build trend data from cost records by day
          // For now derive simple daily breakdown from summary
          // In production, you'd fetch a dedicated trend endpoint
        }

        if (agentRes.ok) {
          const data = await agentRes.json();
          setAgents(data.byAgent ?? []);
        }
      } catch (err) {
        console.error("[CostDashboard] Failed to fetch cost data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const totalCost = summary?.totalCost ?? 0;
  const budgetRemaining = summary?.budgetRemaining ?? 0;
  const projectedMonthly = summary?.projectedMonthlyCost ?? 0;
  const tokensSaved = summary?.tokensSaved ?? 0;
  const costSaved = summary?.costSavedByEfficiency ?? 0;
  const savingsPercent =
    totalCost + costSaved > 0
      ? Math.round((costSaved / (totalCost + costSaved)) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Period Selector Tabs */}
      <div className="flex items-center gap-2">
        {(["today", "this_week", "this_month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p
                ? "bg-zinc-100 text-[#09090b]"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Efficiency Savings Banner */}
      {costSaved > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">
            Your efficiency engine saved ${costSaved.toFixed(2)}{" "}
            {PERIOD_LABELS[period].toLowerCase()} ({savingsPercent}% reduction)
          </p>
          {summary?.efficiency && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {summary.efficiency.tokensSavedByCache.toLocaleString()} tokens
              cached &middot;{" "}
              {summary.efficiency.tokensSavedByOptimization.toLocaleString()}{" "}
              tokens optimized &middot;{" "}
              {summary.efficiency.tasksDeduplicated} tasks deduplicated &middot;{" "}
              {summary.efficiency.tasksBatched} tasks batched
            </p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">
              Total Spent
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {loading ? "..." : `$${totalCost.toFixed(2)}`}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              {summary?.requestCount ?? 0} requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">
              Budget Remaining
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {loading ? "..." : `$${budgetRemaining.toFixed(2)}`}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              of ${monthlyBudget.toFixed(2)} monthly
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">
              Projected Monthly
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {loading ? "..." : `$${projectedMonthly.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">
              Tokens Saved
            </p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {loading ? "..." : tokensSaved.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              ${costSaved.toFixed(2)} saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <CostByAgent agents={agents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CostTrend data={trendData} budgetLine={monthlyBudget / 30} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { CostDashboard };
