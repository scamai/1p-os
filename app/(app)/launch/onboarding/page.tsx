import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingQuiz } from "@/components/launch/OnboardingQuiz";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Check if already has profile
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile) redirect("/launch");

  return <OnboardingQuiz />;
}
