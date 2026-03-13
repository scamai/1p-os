"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface AgentBudgetOverride {
  agentId: string;
  agentName: string;
  dailyBudget: number;
}

interface BudgetControlsProps {
  globalDailyBudget: number;
  globalMonthlyBudget: number;
  alertThreshold: number;
  agentOverrides: AgentBudgetOverride[];
  onSave: (data: {
    globalDailyBudget: number;
    globalMonthlyBudget: number;
    alertThreshold: number;
    agentOverrides: AgentBudgetOverride[];
  }) => void;
}

function BudgetControls({
  globalDailyBudget: initialDaily,
  globalMonthlyBudget: initialMonthly,
  alertThreshold: initialThreshold,
  agentOverrides: initialOverrides,
  onSave,
}: BudgetControlsProps) {
  const [daily, setDaily] = React.useState(initialDaily);
  const [monthly, setMonthly] = React.useState(initialMonthly);
  const [threshold, setThreshold] = React.useState(initialThreshold);
  const [overrides, setOverrides] = React.useState(initialOverrides);

  const handleOverrideChange = (agentId: string, value: number) => {
    setOverrides((prev) =>
      prev.map((o) => (o.agentId === agentId ? { ...o, dailyBudget: value } : o))
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Global Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Input
              label="Daily budget ($)"
              type="number"
              step="0.50"
              min="0"
              value={daily}
              onChange={(e) => setDaily(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Monthly budget ($)"
              type="number"
              step="5"
              min="0"
              value={monthly}
              onChange={(e) => setMonthly(parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-500">
              Alert when spending reaches {threshold}% of daily budget
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full accent-zinc-100"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {overrides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Agent Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {overrides.map((o) => (
                <div key={o.agentId} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label={o.agentName}
                      type="number"
                      step="0.25"
                      min="0"
                      value={o.dailyBudget}
                      onChange={(e) =>
                        handleOverrideChange(
                          o.agentId,
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <span className="pb-2 text-xs text-zinc-500">
                    /day
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() =>
          onSave({
            globalDailyBudget: daily,
            globalMonthlyBudget: monthly,
            alertThreshold: threshold,
            agentOverrides: overrides,
          })
        }
      >
        Save Budget Settings
      </Button>
    </div>
  );
}

export { BudgetControls };
