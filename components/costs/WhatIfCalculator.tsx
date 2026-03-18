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
            <label className="text-sm text-black/50">
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
                className="flex-1 accent-black/[0.04]"
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
                className="w-16 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-center text-sm font-semibold text-black"
              />
            </div>
          </div>

          {/* Strategy selector */}
          <div>
            <label className="text-sm text-black/50">
              Strategy
            </label>
            <div className="mt-2 flex gap-2">
              {STRATEGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStrategy(opt.value)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    strategy === opt.value
                      ? "bg-black/[0.04] text-[#09090b]"
                      : "bg-black/[0.02] text-black/50 hover:bg-black/[0.04]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-black/[0.02] p-3">
              <p className="text-xs text-black/50">
                Current ({currentCount} agents)
              </p>
              <p className="mt-0.5 text-sm font-semibold text-black">
                {loading ? "..." : `$${currentMonthly.toFixed(2)}/mo`}
              </p>
            </div>
            <div
              className={`rounded-md p-3 ${
                overBudget
                  ? "bg-black/[0.08]"
                  : "bg-black/[0.02]"
              }`}
            >
              <p className="text-xs text-black/50">
                Projected ({currentCount + additionalAgents} agents)
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  overBudget
                    ? "text-black font-bold"
                    : "text-black"
                }`}
              >
                {loading ? "..." : `$${projectedMonthly.toFixed(2)}/mo`}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-black/50">
                Additional cost
              </span>
              <span className="font-mono text-black">
                +${difference.toFixed(2)}/mo
              </span>
            </div>
            {monthlyBudget > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-black/50">
                  Monthly budget
                </span>
                <span
                  className={`font-mono ${
                    overBudget
                      ? "text-black font-bold"
                      : "text-black"
                  }`}
                >
                  ${monthlyBudget.toFixed(2)}
                  {overBudget && " (over budget)"}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-black/50">
                Confidence
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  confidence === "high"
                    ? "bg-black/[0.04] text-black font-semibold"
                    : confidence === "medium"
                      ? "bg-black/[0.04] text-black/70"
                      : "bg-black/[0.04] text-black/50"
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
