import { createClient } from "@/lib/supabase/server";
import { CostsView } from "./CostsView";

export default async function CostsPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  const { data: safetyConfig } = await supabase
    .from("safety_config")
    .select("global_daily_budget_usd, global_monthly_budget_usd")
    .eq("business_id", business?.id ?? "")
    .single();

  return (
    <CostsView
      globalDailyBudget={safetyConfig?.global_daily_budget_usd ?? 20}
      globalMonthlyBudget={safetyConfig?.global_monthly_budget_usd ?? 500}
    />
  );
}
