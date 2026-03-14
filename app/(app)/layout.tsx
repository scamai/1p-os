import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch business data for header
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const businessId = business?.id ?? "";

  // Fetch agents
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, status")
    .eq("business_id", businessId)
    .order("name");

  // Fetch sidebar counts in parallel
  const [
    { count: pendingDecisions },
    { count: overdueInvoices },
    { count: activeRelationships },
    { count: activeProjects },
    { count: activeAgents },
    { count: documentCount },
  ] = await Promise.all([
    supabase
      .from("decision_cards")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "overdue"),
    supabase
      .from("relationships")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "active"),
    supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .neq("status", "paused"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  const headerProps = {
    businessName: business?.name ?? business?.business_name ?? undefined,
    healthScore: business?.health_score ?? 100,
    costToday: business?.cost_today ?? 0,
    budgetDaily: business?.budget_daily ?? 5,
  };

  const sidebarCounts = {
    pendingDecisions: pendingDecisions ?? 0,
    overdueInvoices: overdueInvoices ?? 0,
    activeRelationships: activeRelationships ?? 0,
    activeProjects: activeProjects ?? 0,
    activeAgents: activeAgents ?? 0,
    documentCount: documentCount ?? 0,
  };

  const agentList = (agents ?? []).map(
    (a: { id: string; name: string; status: string }) => ({
      id: a.id,
      name: a.name,
      status: a.status,
    })
  );

  return (
    <AppShell
      headerProps={headerProps}
      agents={agentList}
      sidebarCounts={sidebarCounts}
    >
      {children}
    </AppShell>
  );
}
