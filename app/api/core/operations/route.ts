import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Department classification based on agent role keywords
function classifyDepartment(role: string): { name: string; icon: string; color: string } {
  const r = role.toLowerCase();
  if (r.includes("sales") || r.includes("lead") || r.includes("proposal")) {
    return { name: "Sales", icon: "S", color: "#3b82f6" };
  }
  if (r.includes("support") || r.includes("customer") || r.includes("ticket")) {
    return { name: "Support", icon: "H", color: "#10b981" };
  }
  if (r.includes("content") || r.includes("blog") || r.includes("social") || r.includes("marketing")) {
    return { name: "Content", icon: "C", color: "#8b5cf6" };
  }
  if (r.includes("finance") || r.includes("billing") || r.includes("invoice") || r.includes("bookkeep") || r.includes("tax") || r.includes("reconcil")) {
    return { name: "Finance", icon: "F", color: "#f59e0b" };
  }
  if (r.includes("legal") || r.includes("compliance") || r.includes("contract")) {
    return { name: "Legal", icon: "L", color: "#ec4899" };
  }
  if (r.includes("ops") || r.includes("orchestrat") || r.includes("coordinat")) {
    return { name: "Operations", icon: "O", color: "#ef4444" };
  }
  return { name: "General", icon: "G", color: "#71717a" };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const businessId = business.id;

  // Fetch agents, messages, and agent data in parallel
  const [agentsRes, messagesRes, agentDataRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, role, status, tasks_completed, spent_today_usd, spent_this_month_usd, cost_total_usd, hours_saved_estimated, level, budget_daily_usd, budget_monthly_usd, triggers")
      .eq("business_id", businessId)
      .order("name"),
    supabase
      .from("agent_messages")
      .select("from_agent_id, to_agent_id, message_type, chain_id, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("agent_data")
      .select("agent_id, key, value")
      .eq("business_id", businessId),
  ]);

  const agents = agentsRes.data ?? [];
  const messages = messagesRes.data ?? [];
  const agentData = agentDataRes.data ?? [];

  // Build departments by grouping agents
  const deptMap = new Map<string, {
    id: string;
    name: string;
    icon: string;
    color: string;
    agents: Array<{
      id: string;
      name: string;
      role: string;
      status: string;
      tasksToday: number;
      costToday: number;
    }>;
  }>();

  for (const agent of agents) {
    const dept = classifyDepartment(agent.role);
    const deptId = dept.name.toLowerCase();

    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, { id: deptId, ...dept, agents: [] });
    }

    deptMap.get(deptId)!.agents.push({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      tasksToday: agent.tasks_completed ?? 0,
      costToday: parseFloat(agent.spent_today_usd ?? "0"),
    });
  }

  const departments = Array.from(deptMap.values());

  // Build workflow connections from agent messages
  const agentNameMap = new Map<string, string>(agents.map((a: { id: string; name: string }) => [a.id, a.name]));
  const agentRoleMap = new Map<string, string>(agents.map((a: { id: string; role: string }) => [a.id, a.role]));

  // Group messages by chain to infer workflows
  const chainMap = new Map<string, Array<{
    from: string;
    to: string;
    fromName: string;
    toName: string;
    type: string;
    fromDept: string;
    toDept: string;
  }>>();

  for (const msg of messages) {
    if (!msg.from_agent_id || !msg.to_agent_id || !msg.chain_id) continue;

    const fromId = String(msg.from_agent_id);
    const toId = String(msg.to_agent_id);
    const chainId = String(msg.chain_id);
    const msgType = String(msg.message_type);

    const fromName = agentNameMap.get(fromId) ?? "Unknown";
    const toName = agentNameMap.get(toId) ?? "Unknown";
    const fromDept = classifyDepartment(agentRoleMap.get(fromId) ?? "").name;
    const toDept = classifyDepartment(agentRoleMap.get(toId) ?? "").name;

    if (!chainMap.has(chainId)) {
      chainMap.set(chainId, []);
    }
    chainMap.get(chainId)!.push({
      from: fromId,
      to: toId,
      fromName,
      toName,
      type: msgType,
      fromDept,
      toDept,
    });
  }

  // Convert chains to workflow format
  const workflows = Array.from(chainMap.entries()).map(([chainId, steps], i) => ({
    id: chainId,
    name: `Workflow ${i + 1}: ${steps[0]?.fromName ?? "Agent"} → ${steps[steps.length - 1]?.toName ?? "Agent"}`,
    trigger: steps[0]?.type === "task" ? "Task assignment" : steps[0]?.type === "data" ? "Data handoff" : "Event",
    steps: steps.map((s, j) => ({
      agentId: s.from,
      agentName: s.fromName,
      action: `${s.type} → ${s.toName}`,
      department: s.fromDept,
      outputTo: s.to,
      ...(j === steps.length - 1 ? {
        // Add final step receiver
      } : {}),
    })),
  }));

  // Build agent KV state map
  const agentStateMap = new Map<string, Record<string, unknown>>();
  for (const d of agentData) {
    if (!agentStateMap.has(d.agent_id)) {
      agentStateMap.set(d.agent_id, {});
    }
    agentStateMap.get(d.agent_id)![d.key] = d.value;
  }

  return NextResponse.json({
    departments,
    workflows,
    agents: agents.map((a: Record<string, unknown>) => ({
      ...a,
      state: agentStateMap.get(a.id as string) ?? {},
    })),
  });
}
