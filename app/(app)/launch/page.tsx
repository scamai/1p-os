import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LaunchDashboard } from "@/components/launch/LaunchDashboard";

export default async function LaunchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Check if user has a founder profile
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no profile, redirect to onboarding
  if (!profile) redirect("/launch/onboarding");

  // Fetch phases
  const { data: phases } = await supabase
    .from("launch_phases")
    .select("*")
    .order("sort_order");

  // Fetch steps
  const { data: steps } = await supabase
    .from("launch_steps")
    .select("*")
    .order("sort_order");

  // Fetch user progress
  const { data: progress } = await supabase
    .from("user_launch_progress")
    .select("*")
    .eq("user_id", user.id);

  // Fetch upcoming reminders
  const { data: reminders } = await supabase
    .from("launch_reminders")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .order("due_date")
    .limit(5);

  return (
    <LaunchDashboard
      profile={profile}
      phases={phases ?? []}
      steps={steps ?? []}
      progress={progress ?? []}
      reminders={reminders ?? []}
    />
  );
}
