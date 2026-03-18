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
  let profile = null;
  try {
    const { data } = await supabase
      .from("founder_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = data;
  } catch { /* table may not exist */ }

  // If no profile, redirect to onboarding
  if (!profile) redirect("/launch/onboarding");

  // Fetch phases, steps, progress, reminders — all optional
  let phases: any[] = [];
  let steps: any[] = [];
  let progress: any[] = [];
  let reminders: any[] = [];

  try {
    const [phasesRes, stepsRes, progressRes, remindersRes] = await Promise.all([
      supabase.from("launch_phases").select("*").order("sort_order"),
      supabase.from("launch_steps").select("*").order("sort_order"),
      supabase.from("user_launch_progress").select("*").eq("user_id", user.id),
      supabase.from("launch_reminders").select("*").eq("user_id", user.id).eq("is_completed", false).order("due_date").limit(5),
    ]);
    phases = phasesRes.data ?? [];
    steps = stepsRes.data ?? [];
    progress = progressRes.data ?? [];
    reminders = remindersRes.data ?? [];
  } catch { /* tables may not exist yet */ }

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
