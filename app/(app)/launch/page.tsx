import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LaunchDashboard } from "@/components/launch/LaunchDashboard";

export default async function LaunchPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  // Check if user has a founder profile
  let profile = null;
  try {
    const { data } = await supabase
      .from("founder_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    profile = data;
  } catch { /* table may not exist */ }

  // If no profile and not in dev bypass, redirect to onboarding
  if (!profile && process.env.DEV_BYPASS !== "true") redirect("/launch/onboarding");

  // Fetch phases, steps, progress, reminders — all optional
  let phases: any[] = [];
  let steps: any[] = [];
  let progress: any[] = [];
  let reminders: any[] = [];

  try {
    const [phasesRes, stepsRes, progressRes, remindersRes] = await Promise.all([
      supabase.from("launch_phases").select("*").order("sort_order"),
      supabase.from("launch_steps").select("*").order("sort_order"),
      supabase.from("user_launch_progress").select("*").eq("user_id", userId),
      supabase.from("launch_reminders").select("*").eq("user_id", userId).eq("is_completed", false).order("due_date").limit(5),
    ]);
    phases = phasesRes.data ?? [];
    steps = stepsRes.data ?? [];
    progress = progressRes.data ?? [];
    reminders = remindersRes.data ?? [];
  } catch { /* tables may not exist yet */ }

  return (
    <LaunchDashboard
      profile={profile ?? { company_name: "My Company", is_solo: true, planning_to_raise: false, home_state: "CA" }}
      phases={phases ?? []}
      steps={steps ?? []}
      progress={progress ?? []}
      reminders={reminders ?? []}
    />
  );
}
