import { createClient } from "@/lib/supabase/server";
import { TeamView } from "./TeamView";

export default async function TeamPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("business_id", business?.id ?? "")
    .order("name");

  const agentList = (agents ?? []).map(
    (a: {
      id: string;
      name: string;
      role: string;
      status: string;
      tasks_completed: number;
      cost_today: number;
      level: string;
      hours_saved: number;
      cost_total: number;
      decisions_escalated: number;
      approval_rate: number;
    }) => ({
      id: a.id,
      name: a.name,
      role: a.role ?? "Agent",
      initial: a.name.charAt(0).toUpperCase(),
      status: a.status as "working" | "needs_input" | "idle" | "error" | "paused",
      tasksCompleted: a.tasks_completed ?? 0,
      costToday: a.cost_today ?? 0,
      level: a.level ?? "Standard",
      hoursSaved: a.hours_saved ?? 0,
      costTotal: a.cost_total ?? 0,
      decisionsEscalated: a.decisions_escalated ?? 0,
      approvalRate: a.approval_rate ?? 100,
      activityLog: [],
    })
  );

  return <TeamView agents={agentList} />;
}
