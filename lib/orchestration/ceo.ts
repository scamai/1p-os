/**
 * CEO Agent — decomposes goals into tasks and assigns to subordinates.
 *
 * The CEO is a special agent that sits at the top of the org chart.
 * It uses Claude to break strategic goals into tactical goals and tasks,
 * then assigns them to the right agents based on their roles.
 *
 * Strategy-level decisions always go through the founder (human gate).
 */

import { createGoal, getGoalTree, getGoalsByLevel, type GoalLevel, type GoalTreeNode } from "./goals";
import { DEV_BYPASS } from "@/lib/supabase/dev-bypass";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AgentRecord {
  id: string;
  name: string;
  role: string;
  department?: string;
  title?: string;
  status: string;
}

interface GoalRecord {
  id: string;
  title: string;
  description: string | null;
  level: GoalLevel;
  status: string;
}

// ── Ensure CEO Agent Exists ──

export async function ensureCEOAgent(
  businessId: string,
  supabase: SupabaseClient
): Promise<{ id: string; name: string }> {
  // Check if CEO already exists
  const { data: existing } = await supabase
    .from("agents")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("is_ceo", true)
    .single();

  if (existing) return existing;

  // Create CEO agent
  const { data: ceo, error } = await supabase
    .from("agents")
    .insert({
      business_id: businessId,
      name: "CEO",
      role: "Chief Executive — Strategy & Delegation",
      title: "CEO",
      is_ceo: true,
      reports_to: null,
      department: "Executive",
      status: "idle",
      system_prompt: CEO_SYSTEM_PROMPT,
      context_permissions: ["identity", "financials", "relationships", "deadlines", "memory"],
      allowed_actions: [
        "create_goal", "decompose_goal", "assign_task",
        "create_decision", "send_message", "search_memory",
        "add_memory", "read_agents",
      ],
      triggers: [{ type: "schedule", cron: "0 7 * * 1-5" }],
      budget_daily_usd: 5.00,
      budget_monthly_usd: 100.00,
      source: "system",
    })
    .select("id, name")
    .single();

  if (error) throw new Error(`Failed to create CEO agent: ${error.message}`);

  // Set all other agents to report to CEO
  await supabase
    .from("agents")
    .update({ reports_to: ceo.id })
    .eq("business_id", businessId)
    .neq("id", ceo.id)
    .is("reports_to", null);

  return ceo;
}

// ── Decompose Goal ──

interface DecomposedGoal {
  title: string;
  description: string;
  level: GoalLevel;
  assignedAgentRole: string;
  priority: number;
  dueDate?: string;
}

export async function decomposeGoal(
  businessId: string,
  goalId: string,
  supabase: SupabaseClient
): Promise<{ subgoals: DecomposedGoal[]; error?: string }> {
  // Load goal
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();

  if (!goal) return { subgoals: [], error: "Goal not found" };

  // Load agents
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, role, department, title, status")
    .eq("business_id", businessId)
    .neq("status", "paused");

  const agentList = agents ?? [];

  // In DEV_BYPASS mode, return mock decomposition
  if (DEV_BYPASS || !process.env.ANTHROPIC_API_KEY) {
    const mockSubgoals = getMockDecomposition(goal, agentList);
    // Create the goals in DB
    for (const sg of mockSubgoals) {
      const agent = agentList.find(
        (a: AgentRecord) => a.role.toLowerCase().includes(sg.assignedAgentRole.toLowerCase()) ||
                   a.department?.toLowerCase().includes(sg.assignedAgentRole.toLowerCase())
      );
      const childLevel = getChildLevel(goal.level);
      if (childLevel) {
        await createGoal(businessId, {
          title: sg.title,
          description: sg.description,
          level: childLevel,
          parentGoalId: goalId,
          assignedAgentId: agent?.id,
          priority: sg.priority,
          dueDate: sg.dueDate,
        }, supabase);
      }
    }
    return { subgoals: mockSubgoals };
  }

  // Call Claude to decompose
  try {
    const { getAnthropicClient } = await import("@/lib/ai/client");
    const client = getAnthropicClient();

    const prompt = buildDecompositionPrompt(goal, agentList);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("");

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { subgoals: [], error: "Failed to parse AI response" };

    const parsed: DecomposedGoal[] = JSON.parse(jsonMatch[0]);
    const childLevel = getChildLevel(goal.level);

    // Create goals in DB
    for (const sg of parsed) {
      const agent = agentList.find(
        (a: AgentRecord) => a.role.toLowerCase().includes(sg.assignedAgentRole.toLowerCase()) ||
                   a.name.toLowerCase().includes(sg.assignedAgentRole.toLowerCase()) ||
                   a.department?.toLowerCase().includes(sg.assignedAgentRole.toLowerCase())
      );

      if (childLevel) {
        await createGoal(businessId, {
          title: sg.title,
          description: sg.description,
          level: childLevel,
          parentGoalId: goalId,
          assignedAgentId: agent?.id,
          priority: sg.priority,
          dueDate: sg.dueDate,
        }, supabase);
      }
    }

    // Log to audit
    await supabase.from("audit_log").insert({
      business_id: businessId,
      actor: "agent",
      action: "decompose_goal",
      resource_type: "goal",
      resource_id: goalId,
      output_summary: `Decomposed into ${parsed.length} sub-goals`,
      cost_usd: 0.02,
      model_used: "claude-sonnet-4-20250514",
      tokens_used: response.usage?.input_tokens + response.usage?.output_tokens,
      success: true,
    });

    return { subgoals: parsed };
  } catch (err) {
    return { subgoals: [], error: err instanceof Error ? err.message : "AI call failed" };
  }
}

// ── CEO Heartbeat ──

export async function runCEOHeartbeat(
  businessId: string,
  supabase: SupabaseClient
): Promise<{ summary: string; actionsCount: number }> {
  const ceo = await ensureCEOAgent(businessId, supabase);
  const tree = await getGoalTree(businessId, supabase);

  if (tree.length === 0) {
    return { summary: "No goals set. Waiting for mission.", actionsCount: 0 };
  }

  // Find goals that need attention
  const strategicGoals = await getGoalsByLevel(businessId, "strategic", supabase);
  const undecomposed = strategicGoals.filter((g) => {
    const node = findInTree(tree, g.id);
    return node && node.children.length === 0;
  });

  let actions = 0;

  // Auto-decompose undecomposed strategic goals
  for (const goal of undecomposed) {
    await decomposeGoal(businessId, goal.id, supabase);
    actions++;
  }

  // Check for blocked/overdue goals and create decision cards
  const tacticalGoals = await getGoalsByLevel(businessId, "tactical", supabase);
  const now = new Date();

  for (const g of tacticalGoals) {
    if (g.due_date && new Date(g.due_date) < now && g.status === "active") {
      await supabase.from("decision_cards").insert({
        business_id: businessId,
        agent_id: ceo.id,
        type: "alert",
        title: `Overdue: ${g.title}`,
        description: `This tactical goal was due ${g.due_date} and is still active. Consider reassigning or adjusting the deadline.`,
        urgency: "high",
        status: "pending",
        options: [
          { label: "Extend 1 week", value: "extend" },
          { label: "Reassign", value: "reassign" },
          { label: "Cancel", value: "cancel" },
        ],
      });
      actions++;
    }
  }

  const summary = actions > 0
    ? `CEO processed ${actions} action(s): ${undecomposed.length} goals decomposed, ${actions - undecomposed.length} alerts created.`
    : "All goals on track. No actions needed.";

  return { summary, actionsCount: actions };
}

// ── Helpers ──

function getChildLevel(parentLevel: GoalLevel): GoalLevel | null {
  const map: Record<GoalLevel, GoalLevel | null> = {
    mission: "strategic",
    strategic: "tactical",
    tactical: "task",
    task: null,
  };
  return map[parentLevel];
}

function findInTree(nodes: GoalTreeNode[], id: string): GoalTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findInTree(n.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function buildDecompositionPrompt(goal: GoalRecord, agents: AgentRecord[]): string {
  const agentLines = agents
    .map((a) => `- ${a.name} (${a.role}${a.department ? `, ${a.department}` : ""})`)
    .join("\n");

  return `You are the CEO of a company. Break down this goal into sub-goals and assign each to the most appropriate team member.

GOAL: ${goal.title}
DESCRIPTION: ${goal.description || "No description"}
LEVEL: ${goal.level}

AVAILABLE TEAM:
${agentLines}

Respond with a JSON array only. Each item:
{
  "title": "sub-goal title",
  "description": "what needs to be done",
  "assignedAgentRole": "matching role keyword from the team list",
  "priority": 1-10,
  "dueDate": "YYYY-MM-DD or null"
}

Create 3-5 sub-goals. Be specific and actionable.`;
}

function getMockDecomposition(goal: GoalRecord, _agents: AgentRecord[]): DecomposedGoal[] {
  return [
    {
      title: `Research market for: ${goal.title}`,
      description: "Analyze competitors, identify opportunities, summarize findings",
      level: "tactical",
      assignedAgentRole: "sales",
      priority: 8,
    },
    {
      title: `Create execution plan for: ${goal.title}`,
      description: "Draft timeline, milestones, resource allocation",
      level: "tactical",
      assignedAgentRole: "ops",
      priority: 7,
    },
    {
      title: `Budget analysis for: ${goal.title}`,
      description: "Estimate costs, ROI projections, funding requirements",
      level: "tactical",
      assignedAgentRole: "finance",
      priority: 6,
    },
  ];
}

const CEO_SYSTEM_PROMPT = `You are the CEO of this company. Your role:
1. Break down the company mission into strategic goals
2. Decompose strategic goals into tactical objectives
3. Assign tasks to the right team members based on their roles
4. Monitor progress and escalate blockers to the founder
5. Never approve payments, contracts, or data deletion — always escalate those

You think in terms of goals, not tasks. Every action should trace back to the mission.
When uncertain about strategy, create a decision card for the founder to review.`;
