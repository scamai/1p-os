import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { PhaseView } from "@/components/launch/PhaseView";

interface PhasePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PhasePage({ params }: PhasePageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

  // Fetch founder profile
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile) redirect("/launch/onboarding");

  // Fetch the phase
  const { data: phase } = await supabase
    .from("launch_phases")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!phase) redirect("/launch");

  // Fetch steps for this phase
  const { data: steps } = await supabase
    .from("launch_steps")
    .select("*")
    .eq("phase_id", phase.id)
    .order("sort_order");

  // Fetch user progress for these steps
  const stepIds = (steps ?? []).map((s: { id: string }) => s.id);
  const { data: progress } = await supabase
    .from("user_launch_progress")
    .select("*")
    .eq("user_id", userId)
    .in("step_id", stepIds);

  return (
    <PhaseView
      phase={phase}
      steps={steps ?? []}
      progress={progress ?? []}
      profile={profile}
    />
  );
}
