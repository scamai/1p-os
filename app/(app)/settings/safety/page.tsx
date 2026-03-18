import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { SafetyView } from "./SafetyView";

export default async function SafetyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

  const { data: business } = await supabase
    .from("businesses")
    .select("id, budget_daily, budget_monthly, alert_threshold, circuit_breaker_enabled, circuit_breaker_threshold")
    .eq("user_id", userId)
    .single();

  return (
    <SafetyView
      budgetDaily={business?.budget_daily ?? 5}
      budgetMonthly={business?.budget_monthly ?? 150}
      alertThreshold={business?.alert_threshold ?? 80}
      circuitBreakerEnabled={business?.circuit_breaker_enabled ?? true}
      circuitBreakerThreshold={business?.circuit_breaker_threshold ?? 100}
    />
  );
}
