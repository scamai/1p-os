"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface WhatIfCalculatorProps {
  currentAgentCount: number;
  currentDailyCost: number;
  avgCostPerAgent: number;
}

function WhatIfCalculator({
  currentAgentCount,
  currentDailyCost,
  avgCostPerAgent,
}: WhatIfCalculatorProps) {
  const [additionalAgents, setAdditionalAgents] = React.useState(1);

  const projectedDaily =
    currentDailyCost + additionalAgents * avgCostPerAgent;
  const projectedMonthly = projectedDaily * 30;
  const costIncrease = additionalAgents * avgCostPerAgent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What If Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[var(--muted-foreground)]">
              How many more agents?
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                value={additionalAgents}
                onChange={(e) => setAdditionalAgents(parseInt(e.target.value))}
                className="flex-1 accent-[var(--foreground)]"
              />
              <span className="w-8 text-center text-sm font-semibold text-[var(--foreground)]">
                {additionalAgents}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--muted-foreground)]">
                Current ({currentAgentCount} agents)
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                ${currentDailyCost.toFixed(2)}/day
              </p>
            </div>
            <div className="rounded-md bg-[var(--muted)] p-3">
              <p className="text-xs text-[var(--muted-foreground)]">
                Projected ({currentAgentCount + additionalAgents} agents)
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                ${projectedDaily.toFixed(2)}/day
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">
              Additional cost
            </span>
            <span className="font-mono text-[var(--foreground)]">
              +${costIncrease.toFixed(2)}/day (+${(costIncrease * 30).toFixed(2)}/mo)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">
              Projected monthly total
            </span>
            <span className="font-mono text-[var(--foreground)]">
              ${projectedMonthly.toFixed(2)}/mo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { WhatIfCalculator };
