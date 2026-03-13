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
    .eq("owner_id", user.id)
    .single();

  // Fetch agents for sidebar
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, status")
    .eq("business_id", business?.id ?? "")
    .order("name");

  const headerProps = {
    revenue: business?.revenue ?? 0,
    freedomHours: business?.freedom_hours ?? 0,
    healthScore: business?.health_score ?? 100,
    costToday: business?.cost_today ?? 0,
    budgetDaily: business?.budget_daily ?? 5,
  };

  const sidebarAgents = (agents ?? []).map((a: { id: string; name: string; status: string }) => ({
    id: a.id,
    name: a.name,
    initial: a.name.charAt(0).toUpperCase(),
    status: a.status as "working" | "needs_input" | "idle" | "error" | "paused",
  }));

  return (
    <AppShell headerProps={headerProps} agents={sidebarAgents}>
      {children}
    </AppShell>
  );
}
