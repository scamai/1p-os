import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { CostsView } from "./CostsView";

export default async function CostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

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
