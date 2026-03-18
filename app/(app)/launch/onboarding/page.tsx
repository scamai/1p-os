import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingQuiz } from "@/components/launch/OnboardingQuiz";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  // Check if already has profile
  try {
    const { data: profile } = await supabase
      .from("founder_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profile) redirect("/launch");
  } catch { /* table may not exist, show onboarding */ }

  return <OnboardingQuiz />;
}
