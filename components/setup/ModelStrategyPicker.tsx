"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Strategy {
  id: string;
  name: string;
  description: string;
  recommendedFor: string;
  qualityRating: string;
  baseDailyCost: number;
}

const strategies: Strategy[] = [
  {
    id: "quality",
    name: "Maximize Quality",
    description:
      "Use the best models available. Higher cost, best results. Ideal for critical business decisions.",
    recommendedFor: "Businesses where accuracy matters most",
    qualityRating: "Excellent",
    baseDailyCost: 5.5,
  },
  {
    id: "balanced",
    name: "Optimize Cost",
    description:
      "Smart model routing. Uses cheaper models for simple tasks, premium models when needed.",
    recommendedFor: "Most businesses",
    qualityRating: "Very Good",
    baseDailyCost: 2.5,
  },
  {
    id: "savings",
    name: "Maximum Savings",
    description:
      "Use the most cost-effective models. May be slower or less accurate on complex tasks.",
    recommendedFor: "Budget-conscious, simple workflows",
    qualityRating: "Good",
    baseDailyCost: 1.0,
  },
];

function estimateCost(baseDailyCost: number, agentCount: number) {
  const scale = agentCount / 5;
  const daily = baseDailyCost * scale;
  const monthly = daily * 30;
  return {
    daily: daily.toFixed(2),
    monthly: monthly.toFixed(2),
  };
}

interface ModelStrategyPickerProps {
  selected?: string;
  onSelect: (strategyId: string) => void;
  agentCount?: number;
  currentStrategy?: string;
}

function ModelStrategyPicker({
  selected,
  onSelect,
  agentCount = 5,
  currentStrategy,
}: ModelStrategyPickerProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">
        Choose your model strategy
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        This controls which AI models your agents use. You can change this anytime.
      </p>

      <div className="flex flex-col gap-3">
        {strategies.map((s) => {
          const costs = estimateCost(s.baseDailyCost, agentCount);
          const isCurrent = currentStrategy === s.id;
          const isRecommended = s.id === "balanced";

          return (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all ${
                selected === s.id
                  ? "border-zinc-900 ring-1 ring-zinc-300"
                  : ""
              }`}
              onClick={() => onSelect(s.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {s.name}
                      </h3>
                      {isCurrent && (
                        <Badge variant="success">Current</Badge>
                      )}
                      {isRecommended && !isCurrent && (
                        <Badge variant="default">Recommended</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {s.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Recommended for: {s.recommendedFor}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-sm font-mono font-semibold text-zinc-900">
                      ${costs.daily}/day
                    </div>
                    <div className="text-xs font-mono text-zinc-500">
                      ~${costs.monthly}/mo
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      selected === s.id
                        ? "border-zinc-900 bg-zinc-900"
                        : "border-zinc-200"
                    }`}
                  >
                    {selected === s.id && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-6 rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-3 py-2 text-left font-medium text-zinc-500">Strategy</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Daily</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Monthly</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Quality</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((s) => {
              const costs = estimateCost(s.baseDailyCost, agentCount);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-zinc-200 last:border-0 ${
                    selected === s.id ? "bg-zinc-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-zinc-900">
                    {s.name}
                    {s.id === "balanced" && (
                      <span className="ml-1.5 text-zinc-500">*</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-900">
                    ${costs.daily}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-900">
                    ${costs.monthly}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-500">
                    {s.qualityRating}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-1.5 text-[10px] text-zinc-500 bg-zinc-50">
          * Recommended &middot; Estimates based on {agentCount} agent{agentCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

export { ModelStrategyPicker };
