import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CostsView } from "./CostsView";

export default async function CostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, budget_daily, budget_monthly")
    .eq("owner_id", user.id)
    .single();

  const { data: costData } = await supabase
    .from("cost_logs")
    .select("agent_name, amount, created_at")
    .eq("business_id", business?.id ?? "")
    .order("created_at", { ascending: true });

  const agentCostMap = new Map<string, number>();
  let totalSpent = 0;
  const dailyMap = new Map<string, number>();

  (costData ?? []).forEach(
    (c: { agent_name: string; amount: number; created_at: string }) => {
      totalSpent += c.amount;
      agentCostMap.set(
        c.agent_name,
        (agentCostMap.get(c.agent_name) ?? 0) + c.amount
      );
      const date = c.created_at.split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + c.amount);
    }
  );

  const agentCosts = Array.from(agentCostMap.entries()).map(
    ([name, cost]) => ({ name, cost })
  );

  const dailyCosts = Array.from(dailyMap.entries()).map(([date, cost]) => ({
    date,
    cost,
  }));

  const budgetRemaining = (business?.budget_monthly ?? 150) - totalSpent;
  const daysInMonth = 30;
  const daysElapsed = Math.max(dailyCosts.length, 1);
  const projectedMonthly = (totalSpent / daysElapsed) * daysInMonth;

  return (
    <CostsView
      totalSpent={totalSpent}
      budgetRemaining={budgetRemaining}
      projectedMonthly={projectedMonthly}
      agentCosts={agentCosts}
      dailyCosts={dailyCosts}
      currentAgentCount={agentCosts.length}
      avgCostPerAgent={
        agentCosts.length > 0 ? totalSpent / agentCosts.length : 0.5
      }
      globalDailyBudget={business?.budget_daily ?? 5}
      globalMonthlyBudget={business?.budget_monthly ?? 150}
    />
  );
}
