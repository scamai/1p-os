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

  // Fetch business data for header — may not exist for new users
  let business = null;
  let businessId = "";
  let agentList: { id: string; name: string; status: string }[] = [];
  let sidebarCounts = {
    pendingDecisions: 0,
    overdueInvoices: 0,
    activeRelationships: 0,
    activeProjects: 0,
    activeAgents: 0,
    documentCount: 0,
  };

  try {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .single();
    business = data;
    businessId = business?.id ?? "";
  } catch { /* new user, no business yet */ }

  if (businessId) {
    try {
      const [
        { data: agents },
        { count: pendingDecisions },
        { count: overdueInvoices },
        { count: activeRelationships },
        { count: activeProjects },
        { count: activeAgents },
        { count: documentCount },
      ] = await Promise.all([
        supabase
          .from("agents")
          .select("id, name, status")
          .eq("business_id", businessId)
          .order("name"),
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

      agentList = (agents ?? []).map(
        (a: { id: string; name: string; status: string }) => ({
          id: a.id,
          name: a.name,
          status: a.status,
        })
      );

      sidebarCounts = {
        pendingDecisions: pendingDecisions ?? 0,
        overdueInvoices: overdueInvoices ?? 0,
        activeRelationships: activeRelationships ?? 0,
        activeProjects: activeProjects ?? 0,
        activeAgents: activeAgents ?? 0,
        documentCount: documentCount ?? 0,
      };
    } catch { /* tables may not exist yet */ }
  }

  const headerProps = {
    businessName: business?.name ?? business?.business_name ?? undefined,
    healthScore: business?.health_score ?? 100,
    costToday: business?.cost_today ?? 0,
    budgetDaily: business?.budget_daily ?? 5,
  };

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
