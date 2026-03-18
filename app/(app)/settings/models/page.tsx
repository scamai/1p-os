"use client";

import * as React from "react";
import { ModelStrategyPicker } from "@/components/setup/ModelStrategyPicker";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface TaskBreakdown {
  taskType: string;
  complexity: string;
  model: string;
  modelId: string;
  costPerTask: number;
  dailyFrequency: number;
  estimatedDailyCost: number;
}

interface RoutingData {
  strategy: string;
  name: string;
  description: string;
  agentCount: number;
  taskBreakdown: TaskBreakdown[];
  estimatedDailyCost: number;
  estimatedMonthlyCost: number;
}

interface ComparisonEntry {
  strategy: string;
  name: string;
  estimatedDailyCost: number;
  estimatedMonthlyCost: number;
}

export default function ModelsPage() {
  const [selected, setSelected] = React.useState<string>("");
  const [currentStrategy, setCurrentStrategy] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [routingData, setRoutingData] = React.useState<RoutingData | null>(null);
  const [comparison, setComparison] = React.useState<ComparisonEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRouting = React.useCallback(async () => {
    try {
      const res = await fetch("/api/efficiency/routing");
      if (res.ok) {
        const data = await res.json();
        setRoutingData(data.routing);
        setComparison(data.comparison ?? []);
        setCurrentStrategy(data.routing.strategy);
        if (!selected) {
          setSelected(data.routing.strategy);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selected]);

  React.useEffect(() => {
    fetchRouting();
  }, [fetchRouting]);

  const handleSave = async () => {
    if (!selected || selected === currentStrategy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/efficiency/routing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: selected }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutingData(data.routing);
        setComparison(data.comparison ?? []);
        setCurrentStrategy(data.routing.strategy);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-black/[0.04]" />
          <div className="h-4 w-72 rounded bg-black/[0.04]" />
          <div className="h-32 rounded bg-black/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-black">
        Model Routing
      </h1>
      <p className="mb-6 text-sm text-black/50">
        Choose how your agents select AI models for their tasks.
      </p>

      {/* Current strategy indicator */}
      {routingData && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-black/[0.08] bg-black/[0.04] px-4 py-3">
          <div className="flex-1">
            <p className="text-xs text-black/50">Current strategy</p>
            <p className="text-sm font-semibold text-black">
              {routingData.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-black/50">Estimated cost</p>
            <p className="text-sm font-mono font-semibold text-black">
              ${routingData.estimatedDailyCost}/day &middot; ${routingData.estimatedMonthlyCost}/mo
            </p>
          </div>
        </div>
      )}

      <ModelStrategyPicker
        selected={selected}
        onSelect={setSelected}
        agentCount={routingData?.agentCount ?? 5}
        currentStrategy={currentStrategy}
      />

      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!selected || selected === currentStrategy}
          loading={saving}
        >
          {selected === currentStrategy ? "Current Strategy" : "Switch Strategy"}
        </Button>
        {saved && (
          <span className="text-sm text-black/70">Strategy updated!</span>
        )}
      </div>

      {/* Task routing breakdown table */}
      {routingData?.taskBreakdown && routingData.taskBreakdown.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-black">
            Task Routing Breakdown
          </h2>
          <div className="rounded-lg border border-black/[0.08] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.08] bg-black/[0.04]">
                  <th className="px-3 py-2 text-left font-medium text-black/50">
                    Task Type
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-black/50">
                    Complexity
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-black/50">
                    Model
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-black/50">
                    Est. Daily Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {routingData.taskBreakdown.map((task) => (
                  <tr
                    key={task.taskType}
                    className="border-b border-black/[0.08] last:border-0"
                  >
                    <td className="px-3 py-2 text-black">
                      {task.taskType}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          task.complexity === "high"
                            ? "destructive"
                            : task.complexity === "medium"
                            ? "warning"
                            : "success"
                        }
                      >
                        {task.complexity}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-black/50">
                      {task.model}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-black">
                      ${task.estimatedDailyCost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy comparison */}
      {comparison.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-black">
            Strategy Comparison
          </h2>
          <div className="rounded-lg border border-black/[0.08] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.08] bg-black/[0.04]">
                  <th className="px-3 py-2 text-left font-medium text-black/50">
                    Strategy
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-black/50">
                    Daily
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-black/50">
                    Monthly
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((entry) => (
                  <tr
                    key={entry.strategy}
                    className={`border-b border-black/[0.08] last:border-0 ${
                      entry.strategy === currentStrategy ? "bg-black/[0.04]/50" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-black">
                      <span className="flex items-center gap-2">
                        {entry.name}
                        {entry.strategy === currentStrategy && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-black">
                      ${entry.estimatedDailyCost}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-black">
                      ${entry.estimatedMonthlyCost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
