import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SafetyView } from "./SafetyView";

export default async function SafetyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, budget_daily, budget_monthly, alert_threshold, circuit_breaker_enabled, circuit_breaker_threshold")
    .eq("owner_id", user.id)
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
