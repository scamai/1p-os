import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id, business_name").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, role, title, department, reports_to, is_ceo, status, tasks_completed, cost_total_usd, spent_today_usd")
    .eq("business_id", business.id)
    .order("is_ceo", { ascending: false })
    .order("name");

  // Build tree
  const agentList = agents ?? [];
  const map = new Map<string, Record<string, any>>();
  for (const a of agentList) {
    map.set((a as any).id, { ...(a as any), reports: [] });
  }
  const roots: Record<string, any>[] = [];

  for (const a of agentList) {
    const agent = a as any;
    const node = map.get(agent.id)!;
    if (agent.reports_to && map.has(agent.reports_to)) {
      map.get(agent.reports_to)!.reports.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({
    businessName: business.business_name,
    orgChart: roots,
    agents: agentList,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { agentId, reportsTo, title, department } = body;

  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  // Prevent cycles: walk up from reportsTo, ensure we never hit agentId
  if (reportsTo) {
    const { data: agents } = await supabase.from("agents").select("id, reports_to");
    const agentMap = new Map((agents ?? []).map((a: any) => [a.id, a.reports_to]));

    let current = reportsTo;
    const visited = new Set<string>();
    while (current) {
      if (current === agentId) {
        return NextResponse.json({ error: "Cannot create circular reporting line" }, { status: 422 });
      }
      if (visited.has(current)) break;
      visited.add(current);
      current = agentMap.get(current) ?? null;
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (reportsTo !== undefined) updates.reports_to = reportsTo || null;
  if (title !== undefined) updates.title = title;
  if (department !== undefined) updates.department = department;

  const { error } = await supabase.from("agents").update(updates).eq("id", agentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
