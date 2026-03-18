import { createClient } from "@/lib/supabase/server";
import { SafetyView } from "./SafetyView";

export default async function SafetyPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

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
