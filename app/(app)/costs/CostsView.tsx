"use client";

import { CostDashboard } from "@/components/costs/CostDashboard";
import { BudgetControls } from "@/components/costs/BudgetControls";
import { WhatIfCalculator } from "@/components/costs/WhatIfCalculator";

interface CostsViewProps {
  globalDailyBudget: number;
  globalMonthlyBudget: number;
}

function CostsView({
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-black">
        Costs
      </h1>

      <div className="flex flex-col gap-6">
        <CostDashboard />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BudgetControls
            globalDailyBudget={globalDailyBudget}
            globalMonthlyBudget={globalMonthlyBudget}
            alertThreshold={80}
            agentOverrides={[]}
            onSave={handleSaveBudget}
          />

          <WhatIfCalculator />
        </div>
      </div>
    </div>
  );
}

export { CostsView };
