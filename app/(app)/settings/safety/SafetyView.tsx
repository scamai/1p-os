"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface SafetyViewProps {
  budgetDaily: number;
  budgetMonthly: number;
  alertThreshold: number;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
}

function SafetyView({
  budgetDaily: initDaily,
  budgetMonthly: initMonthly,
  alertThreshold: initAlert,
  circuitBreakerEnabled: initCBEnabled,
  circuitBreakerThreshold: initCBThreshold,
}: SafetyViewProps) {
  const [daily, setDaily] = React.useState(initDaily);
  const [monthly, setMonthly] = React.useState(initMonthly);
  const [alert, setAlert] = React.useState(initAlert);
  const [cbEnabled, setCbEnabled] = React.useState(initCBEnabled);
  const [cbThreshold, setCbThreshold] = React.useState(initCBThreshold);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/safety/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalDailyBudget: daily,
          globalMonthlyBudget: monthly,
          alertThreshold: alert,
          circuitBreakerEnabled: cbEnabled,
          circuitBreakerThreshold: cbThreshold,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-black">
        Safety &amp; Budgets
      </h1>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
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
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-black/50">
                Alert at {alert}% of daily budget
              </label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={alert}
                onChange={(e) => setAlert(parseInt(e.target.value))}
                className="w-full accent-black"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Circuit Breaker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-black">
                <input
                  type="checkbox"
                  checked={cbEnabled}
                  onChange={(e) => setCbEnabled(e.target.checked)}
                  className="accent-black"
                />
                Enable circuit breaker
              </label>
              <p className="text-xs text-black/50">
                Automatically pause all agents if daily spend exceeds threshold.
              </p>
              {cbEnabled && (
                <Input
                  label="Circuit breaker threshold ($)"
                  type="number"
                  step="1"
                  min="1"
                  value={cbThreshold}
                  onChange={(e) =>
                    setCbThreshold(parseFloat(e.target.value) || 0)
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} loading={saving}>
          Save Safety Settings
        </Button>
      </div>
    </div>
  );
}

export { SafetyView };
