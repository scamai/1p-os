"use client";

import { Card, CardContent } from "@/components/ui/Card";

interface Strategy {
  id: string;
  name: string;
  description: string;
  costRange: string;
  recommendedFor: string;
}

const strategies: Strategy[] = [
  {
    id: "quality",
    name: "Maximize Quality",
    description:
      "Use the best models available. Higher cost, best results. Ideal for critical business decisions.",
    costRange: "$3-8/day",
    recommendedFor: "Businesses where accuracy matters most",
  },
  {
    id: "balanced",
    name: "Optimize Cost",
    description:
      "Smart model routing. Uses cheaper models for simple tasks, premium models when needed.",
    costRange: "$1-4/day",
    recommendedFor: "Most businesses",
  },
  {
    id: "savings",
    name: "Maximum Savings",
    description:
      "Use the most cost-effective models. May be slower or less accurate on complex tasks.",
    costRange: "$0.50-2/day",
    recommendedFor: "Budget-conscious, simple workflows",
  },
];

interface ModelStrategyPickerProps {
  selected?: string;
  onSelect: (strategyId: string) => void;
}

function ModelStrategyPicker({
  selected,
  onSelect,
}: ModelStrategyPickerProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
        Choose your model strategy
      </h2>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        This controls which AI models your agents use. You can change this anytime.
      </p>

      <div className="flex flex-col gap-3">
        {strategies.map((s) => (
          <Card
            key={s.id}
            className={`cursor-pointer transition-all ${
              selected === s.id
                ? "border-[var(--foreground)] ring-1 ring-[var(--ring)]"
                : ""
            }`}
            onClick={() => onSelect(s.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {s.description}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Recommended for: {s.recommendedFor}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <span className="text-sm font-mono text-[var(--foreground)]">
                    {s.costRange}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    selected === s.id
                      ? "border-[var(--foreground)] bg-[var(--foreground)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {selected === s.id && (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--background)]" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { ModelStrategyPicker };
