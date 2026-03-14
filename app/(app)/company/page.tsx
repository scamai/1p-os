import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanyView } from "./CompanyView";

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, morning_brief")
    .eq("user_id", user.id)
    .single();

  const businessId = business?.id ?? "";

  // Load decisions, agents, metrics, and recent activity in parallel
  const [
    { data: decisions },
    { data: agents },
    { data: paidInvoices },
    { data: costRecords },
    { data: recentActivity },
    { count: pipelineCount },
    { count: pendingDecisionCount },
  ] = await Promise.all([
    supabase
      .from("decisions")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("agents")
      .select("id, name, role, status, current_task")
      .eq("business_id", businessId)
      .order("name"),
    supabase
      .from("invoices")
      .select("amount")
      .eq("business_id", businessId)
      .eq("status", "paid"),
    supabase
      .from("audit_log")
      .select("cost")
      .eq("business_id", businessId)
      .gte("created_at", `${new Date().toISOString().split("T")[0]}T00:00:00`),
    supabase
      .from("audit_log")
      .select("id, actor, action, details, cost, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("relationships")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("type", "lead"),
    supabase
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending"),
  ]);

  const cards = (decisions ?? []).map(
    (d: {
      id: string;
      type: string;
      title: string;
      description: string;
      urgency: string;
      options: { label: string; value: string }[] | null;
      status: string;
    }) => ({
      id: d.id,
      type: d.type as "approval" | "choice" | "fyi" | "alert",
      title: d.title,
      description: d.description,
      urgency: (d.urgency ?? "low") as "low" | "medium" | "high" | "critical",
      options: d.options ?? [],
      done: d.status === "resolved",
    })
  );

  const agentList = (agents ?? []).map(
    (a: { id: string; name: string; role: string; status: string; current_task: string | null }) => ({
      id: a.id,
      name: a.name,
      role: a.role ?? "",
      status: a.status as "active" | "idle" | "paused" | "error",
      currentTask: a.current_task ?? null,
    })
  );

  const revenueMtd = (paidInvoices ?? []).reduce(
    (s: number, i: { amount: number }) => s + (i.amount ?? 0),
    0
  );
  const spendToday = (costRecords ?? []).reduce(
    (s: number, r: { cost: number }) => s + (r.cost ?? 0),
    0
  );

  const activity = (recentActivity ?? []).map(
    (a: {
      id: string;
      actor: string;
      action: string;
      details: string | null;
      cost: number | null;
      created_at: string;
    }) => ({
      id: a.id,
      actor: a.actor ?? "System",
      action: a.action,
      detail: a.details ?? null,
      cost: a.cost ?? null,
      createdAt: a.created_at,
    })
  );

  return (
    <CompanyView
      cards={cards}
      agents={agentList}
      metrics={{
        revenueMtd,
        spendToday,
        activeAgents: agentList.filter((a) => a.status === "active").length,
        pendingDecisions: pendingDecisionCount ?? 0,
        pipelineLeads: pipelineCount ?? 0,
      }}
      activity={activity}
    />
  );
}
