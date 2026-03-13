"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CostByAgent } from "@/components/costs/CostByAgent";
import { CostTrend } from "@/components/costs/CostTrend";

type Period = "today" | "week" | "month";

interface CostDashboardProps {
  totalSpent: number;
  budgetRemaining: number;
  projectedMonthly: number;
  agentCosts: { name: string; cost: number }[];
  dailyCosts: { date: string; cost: number }[];
}

function CostDashboard({
  totalSpent,
  budgetRemaining,
  projectedMonthly,
  agentCosts,
  dailyCosts,
}: CostDashboardProps) {
  const [period, setPeriod] = React.useState<Period>("today");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Total Spent</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              ${totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Budget Remaining</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              ${budgetRemaining.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Projected Monthly</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              ${projectedMonthly.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <CostByAgent agents={agentCosts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CostTrend data={dailyCosts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { CostDashboard };
