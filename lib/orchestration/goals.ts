/**
 * Goal Hierarchy — mission → strategic → tactical → task
 *
 * Every task in the system traces back to the company mission.
 * Agents see "why" they're working, not just "what".
 *
 * Ported from Paperclip's goal alignment system.
 */

import { DEV_BYPASS } from "@/lib/supabase/dev-bypass";

type GoalLevel = "mission" | "strategic" | "tactical" | "task";
type GoalStatus = "active" | "completed" | "cancelled" | "blocked";

const LEVEL_HIERARCHY: Record<GoalLevel, GoalLevel | null> = {
  mission: null,       // no parent required
  strategic: "mission",
  tactical: "strategic",
  task: "tactical",
};

interface CreateGoalInput {
  title: string;
  description?: string;
  level: GoalLevel;
  parentGoalId?: string;
  assignedAgentId?: string;
  priority?: number;
  dueDate?: string;
}

interface Goal {
  id: string;
  business_id: string;
  parent_goal_id: string | null;
  level: GoalLevel;
  title: string;
  description: string | null;
  status: GoalStatus;
  assigned_agent_id: string | null;
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  checked_out_by: string | null;
  checked_out_at: string | null;
  created_at: string;
}

interface GoalTreeNode extends Goal {
  children: GoalTreeNode[];
}

// ── Create Goal ──

export async function createGoal(
  businessId: string,
  input: CreateGoalInput,
  supabase: any
): Promise<{ data: Goal | null; error: string | null }> {
  // Validate level hierarchy
  const requiredParentLevel = LEVEL_HIERARCHY[input.level];

  if (requiredParentLevel && !input.parentGoalId) {
    return { data: null, error: `${input.level} goal requires a ${requiredParentLevel} parent` };
  }

  if (input.parentGoalId && requiredParentLevel) {
    const { data: parent } = await supabase
      .from("goals")
      .select("level")
      .eq("id", input.parentGoalId)
      .single();

    if (!parent) {
      return { data: null, error: "Parent goal not found" };
    }
    if (parent.level !== requiredParentLevel) {
      return { data: null, error: `${input.level} goal must have a ${requiredParentLevel} parent, got ${parent.level}` };
    }
  }

  if (input.level === "mission" && input.parentGoalId) {
    return { data: null, error: "Mission goals cannot have a parent" };
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      business_id: businessId,
      parent_goal_id: input.parentGoalId || null,
      level: input.level,
      title: input.title,
      description: input.description || null,
      assigned_agent_id: input.assignedAgentId || null,
      priority: input.priority ?? 5,
      due_date: input.dueDate || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ── Get Goal Tree ──

export async function getGoalTree(
  businessId: string,
  supabase: any
): Promise<GoalTreeNode[]> {
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .order("priority", { ascending: false });

  if (!goals?.length) return [];

  // Build tree from flat list
  const map = new Map<string, GoalTreeNode>();
  const roots: GoalTreeNode[] = [];

  for (const g of goals) {
    map.set(g.id, { ...g, children: [] });
  }

  for (const g of goals) {
    const node = map.get(g.id)!;
    if (g.parent_goal_id && map.has(g.parent_goal_id)) {
      map.get(g.parent_goal_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ── Get Goals by Level ──

export async function getGoalsByLevel(
  businessId: string,
  level: GoalLevel,
  supabase: any
): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("business_id", businessId)
    .eq("level", level)
    .neq("status", "cancelled")
    .order("priority", { ascending: false });

  return data ?? [];
}

// ── Get Goals by Agent ──

export async function getGoalsByAgent(
  agentId: string,
  supabase: any
): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("assigned_agent_id", agentId)
    .neq("status", "cancelled")
    .order("priority", { ascending: false });

  return data ?? [];
}

// ── Update Goal Status ──

export async function updateGoalStatus(
  goalId: string,
  status: GoalStatus,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
    updates.checked_out_by = null;
    updates.checked_out_at = null;
  }

  const { error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goalId);

  if (error) return { success: false, error: error.message };

  // Auto-complete parent if all siblings are done
  if (status === "completed") {
    await cascadeCompletion(goalId, supabase);
  }

  return { success: true };
}

async function cascadeCompletion(goalId: string, supabase: any) {
  const { data: goal } = await supabase
    .from("goals")
    .select("parent_goal_id")
    .eq("id", goalId)
    .single();

  if (!goal?.parent_goal_id) return;

  const { data: siblings } = await supabase
    .from("goals")
    .select("status")
    .eq("parent_goal_id", goal.parent_goal_id)
    .neq("status", "cancelled");

  if (!siblings?.length) return;

  const allDone = siblings.every((s: { status: string }) => s.status === "completed");
  if (allDone) {
    await supabase
      .from("goals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.parent_goal_id);

    // Recurse up
    await cascadeCompletion(goal.parent_goal_id, supabase);
  }
}

// ── Atomic Task Checkout ──

export async function checkoutTask(
  goalId: string,
  agentId: string,
  supabase: any
): Promise<{ success: boolean; alreadyCheckedOut?: string }> {
  if (DEV_BYPASS) return { success: true };

  // Atomic: only succeeds if checked_out_by is currently NULL
  const { data, error } = await supabase
    .from("goals")
    .update({
      checked_out_by: agentId,
      checked_out_at: new Date().toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .is("checked_out_by", null)
    .eq("level", "task")
    .select("id")
    .single();

  if (error || !data) {
    // Check who has it
    const { data: existing } = await supabase
      .from("goals")
      .select("checked_out_by")
      .eq("id", goalId)
      .single();

    return {
      success: false,
      alreadyCheckedOut: existing?.checked_out_by ?? "unknown",
    };
  }

  return { success: true };
}

// ── Release Task ──

export async function releaseTask(
  goalId: string,
  agentId: string,
  supabase: any
): Promise<{ success: boolean }> {
  if (DEV_BYPASS) return { success: true };

  const { error } = await supabase
    .from("goals")
    .update({
      checked_out_by: null,
      checked_out_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("checked_out_by", agentId);

  return { success: !error };
}

export type { Goal, GoalLevel, GoalStatus, GoalTreeNode, CreateGoalInput };
