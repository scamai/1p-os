"use client";

import { CostDashboard } from "@/components/costs/CostDashboard";
import { BudgetControls } from "@/components/costs/BudgetControls";
import { WhatIfCalculator } from "@/components/costs/WhatIfCalculator";

interface CostsViewProps {
  totalSpent: number;
  budgetRemaining: number;
  projectedMonthly: number;
  agentCosts: { name: string; cost: number }[];
  dailyCosts: { date: string; cost: number }[];
  currentAgentCount: number;
  avgCostPerAgent: number;
  globalDailyBudget: number;
  globalMonthlyBudget: number;
}

function CostsView({
  totalSpent,
  budgetRemaining,
  projectedMonthly,
  agentCosts,
  dailyCosts,
  currentAgentCount,
  avgCostPerAgent,
  globalDailyBudget,
  globalMonthlyBudget,
}: CostsViewProps) {
  const handleSaveBudget = async (data: {
    globalDailyBudget: number;
    globalMonthlyBudget: number;
    alertThreshold: number;
    agentOverrides: { agentId: string; agentName: string; dailyBudget: number }[];
  }) => {
    await fetch("/api/safety/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Costs
      </h1>

      <div className="flex flex-col gap-6">
        <CostDashboard
          totalSpent={totalSpent}
          budgetRemaining={budgetRemaining}
          projectedMonthly={projectedMonthly}
          agentCosts={agentCosts}
          dailyCosts={dailyCosts}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BudgetControls
            globalDailyBudget={globalDailyBudget}
            globalMonthlyBudget={globalMonthlyBudget}
            alertThreshold={80}
            agentOverrides={[]}
            onSave={handleSaveBudget}
          />

          <WhatIfCalculator
            currentAgentCount={currentAgentCount}
            currentDailyCost={totalSpent}
            avgCostPerAgent={avgCostPerAgent}
          />
        </div>
      </div>
    </div>
  );
}

export { CostsView };
