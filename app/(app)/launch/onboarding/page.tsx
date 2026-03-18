import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { OnboardingQuiz } from "@/components/launch/OnboardingQuiz";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

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
