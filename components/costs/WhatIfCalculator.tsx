"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Strategy = "cost-optimized" | "balanced" | "quality-first";

const STRATEGY_OPTIONS: { value: Strategy; label: string }[] = [
  { value: "quality-first", label: "Quality" },
  { value: "balanced", label: "Balanced" },
  { value: "cost-optimized", label: "Savings" },
];

interface EstimateResponse {
  currentAgentCount: number;
  currentMonthlyCost: number;
  additionalMonthlyCost: number;
  projectedMonthlyTotal: number;
  monthlyBudget: number;
  overBudget: boolean;
  difference: number;
  confidence: "high" | "medium" | "low";
}

function WhatIfCalculator() {
  const [additionalAgents, setAdditionalAgents] = React.useState(1);
  const [strategy, setStrategy] = React.useState<Strategy>("balanced");
  const [estimate, setEstimate] = React.useState<EstimateResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchEstimate() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/efficiency/estimate?action=add_agents&count=${additionalAgents}&strategy=${strategy}`
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setEstimate(data);
        }
      } catch (err) {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEstimate();
    return () => {
      cancelled = true;
    };
  }, [additionalAgents, strategy]);

  const currentMonthly = estimate?.currentMonthlyCost ?? 0;
  const projectedMonthly = estimate?.projectedMonthlyTotal ?? 0;
  const difference = estimate?.difference ?? 0;
  const currentCount = estimate?.currentAgentCount ?? 0;
  const monthlyBudget = estimate?.monthlyBudget ?? 0;
  const overBudget = estimate?.overBudget ?? false;
  const confidence = estimate?.confidence ?? "low";

  return (
    <Card>
      <CardHeader>
        <CardTitle>What-If Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Agent count slider */}
          <div>
            <label className="text-sm text-zinc-500">
              If I hire more agents...
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="20"
                value={additionalAgents}
                onChange={(e) =>
                  setAdditionalAgents(parseInt(e.target.value))
                }
                className="flex-1 accent-zinc-100"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={additionalAgents}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 50) {
                    setAdditionalAgents(val);
                  }
                }}
                className="w-16 rounded-md border border-zinc-200 bg-white px-2 py-1 text-center text-sm font-semibold text-zinc-900"
              />
            </div>
          </div>

          {/* Strategy selector */}
          <div>
            <label className="text-sm text-zinc-500">
              Strategy
            </label>
            <div className="mt-2 flex gap-2">
              {STRATEGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStrategy(opt.value)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    strategy === opt.value
                      ? "bg-zinc-100 text-[#09090b]"
                      : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500">
                Current ({currentCount} agents)
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                {loading ? "..." : `$${currentMonthly.toFixed(2)}/mo`}
              </p>
            </div>
            <div
              className={`rounded-md p-3 ${
                overBudget
                  ? "bg-zinc-200"
                  : "bg-zinc-50"
              }`}
            >
              <p className="text-xs text-zinc-500">
                Projected ({currentCount + additionalAgents} agents)
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  overBudget
                    ? "text-zinc-900 font-bold"
                    : "text-zinc-900"
                }`}
              >
                {loading ? "..." : `$${projectedMonthly.toFixed(2)}/mo`}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">
                Additional cost
              </span>
              <span className="font-mono text-zinc-900">
                +${difference.toFixed(2)}/mo
              </span>
            </div>
            {monthlyBudget > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">
                  Monthly budget
                </span>
                <span
                  className={`font-mono ${
                    overBudget
                      ? "text-zinc-900 font-bold"
                      : "text-zinc-900"
                  }`}
                >
                  ${monthlyBudget.toFixed(2)}
                  {overBudget && " (over budget)"}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">
                Confidence
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  confidence === "high"
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : confidence === "medium"
                      ? "bg-zinc-100 text-zinc-700"
                      : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {confidence}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { WhatIfCalculator };
