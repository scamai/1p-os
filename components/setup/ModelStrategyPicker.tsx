"use client";

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
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Choose your model strategy
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        This controls which AI models your agents use. You can change this anytime.
      </p>

      <div className="flex flex-col gap-1.5">
        {strategies.map((s) => {
          const costs = estimateCost(s.baseDailyCost, agentCount);
          const isCurrent = currentStrategy === s.id;
          const isRecommended = s.id === "balanced";
          const isSelected = selected === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {s.name}
                  </span>
                  {isCurrent && (
                    <Badge variant="success">Current</Badge>
                  )}
                  {isRecommended && !isCurrent && (
                    <span className="text-[10px] text-slate-400">Recommended</span>
                  )}
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <p className="text-xs font-mono text-slate-600">${costs.daily}/day</p>
                <p className="text-[11px] font-mono text-slate-400">~${costs.monthly}/mo</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-medium text-slate-500">Strategy</th>
              <th className="px-3 py-2 text-right font-medium text-slate-500">Daily</th>
              <th className="px-3 py-2 text-right font-medium text-slate-500">Monthly</th>
              <th className="px-3 py-2 text-right font-medium text-slate-500">Quality</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((s) => {
              const costs = estimateCost(s.baseDailyCost, agentCount);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-slate-200 last:border-0 ${
                    selected === s.id ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-900">${costs.daily}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-900">${costs.monthly}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{s.qualityRating}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50">
          Estimates based on {agentCount} agent{agentCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

export { ModelStrategyPicker };
