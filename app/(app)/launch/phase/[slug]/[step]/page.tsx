import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StepView } from "@/components/launch/StepView";

interface StepPageProps {
  params: Promise<{ slug: string; step: string }>;
}

export default async function StepPage({ params }: StepPageProps) {
  const { slug, step: stepSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

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

  // Fetch the step
  const { data: step } = await supabase
    .from("launch_steps")
    .select("*")
    .eq("slug", stepSlug)
    .eq("phase_id", phase.id)
    .single();

  if (!step) redirect(`/launch/phase/${slug}`);

  // Fetch user progress for this step
  const { data: progressArr } = await supabase
    .from("user_launch_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("step_id", step.id);

  const progress = progressArr?.[0] ?? null;

  // Fetch all steps in this phase for navigation
  const { data: allSteps } = await supabase
    .from("launch_steps")
    .select("id, slug, title, sort_order")
    .eq("phase_id", phase.id)
    .order("sort_order");

  return (
    <StepView
      phase={phase}
      step={step}
      progress={progress}
      allSteps={allSteps ?? []}
      userId={userId}
    />
  );
}
