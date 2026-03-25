import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/launch/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  // Check if already has profile
  try {
    const { data: profile } = await supabase
      .from("founder_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profile) redirect("/launch");
  } catch { /* table may not exist, show onboarding */ }

  return <OnboardingFlow />;
}
