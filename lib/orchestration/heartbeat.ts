/**
 * Heartbeat System — agents get triggered in bounded execution windows.
 *
 * Agents don't run continuously. They wake up, process tasks, and go back
 * to sleep. The CEO runs first so tasks are created before workers pick them up.
 *
 * Ported from Paperclip's heartbeat orchestration.
 */

import { checkoutTask, releaseTask, updateGoalStatus, getGoalsByAgent } from "./goals";
import { runCEOHeartbeat, ensureCEOAgent } from "./ceo";
import { DEV_BYPASS } from "@/lib/supabase/dev-bypass";

const MAX_TASKS_PER_HEARTBEAT = 5;

interface HeartbeatResult {
  runId: string;
  agentId: string;
  agentName: string;
  status: "completed" | "failed" | "timeout";
  tasksProcessed: number;
  costUsd: number;
  summary: string;
  error?: string;
}

// ── Trigger Single Agent Heartbeat ──

export async function triggerHeartbeat(
  businessId: string,
  agentId: string,
  triggerType: "scheduled" | "event" | "manual" | "ceo_delegation",
  supabase: any
): Promise<HeartbeatResult> {
  // Get agent info
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, role, status, is_ceo, budget_daily_usd, spent_today_usd")
    .eq("id", agentId)
    .single();

  if (!agent) {
    return {
      runId: "", agentId, agentName: "Unknown",
      status: "failed", tasksProcessed: 0, costUsd: 0,
      summary: "Agent not found", error: "Agent not found",
    };
  }

  if (agent.status === "paused") {
    return {
      runId: "", agentId, agentName: agent.name,
      status: "failed", tasksProcessed: 0, costUsd: 0,
      summary: "Agent is paused", error: "Agent is paused",
    };
  }

  // Budget check
  if (parseFloat(agent.spent_today_usd ?? "0") >= parseFloat(agent.budget_daily_usd ?? "2")) {
    return {
      runId: "", agentId, agentName: agent.name,
      status: "failed", tasksProcessed: 0, costUsd: 0,
      summary: "Daily budget exceeded", error: "Budget limit reached",
    };
  }

  // Create heartbeat run record
  const { data: run } = await supabase
    .from("heartbeat_runs")
    .insert({
      business_id: businessId,
      agent_id: agentId,
      trigger_type: triggerType,
      status: "running",
    })
    .select("id")
    .single();

  const runId = run?.id ?? crypto.randomUUID();

  // If CEO, run CEO heartbeat
  if (agent.is_ceo) {
    try {
      const result = await runCEOHeartbeat(businessId, supabase);

      await supabase
        .from("heartbeat_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          tasks_processed: result.actionsCount,
          summary: result.summary,
        })
        .eq("id", runId);

      return {
        runId, agentId, agentName: agent.name,
        status: "completed", tasksProcessed: result.actionsCount,
        costUsd: 0, summary: result.summary,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "CEO heartbeat failed";
      await supabase
        .from("heartbeat_runs")
        .update({ status: "failed", completed_at: new Date().toISOString(), error: errMsg })
        .eq("id", runId);

      return {
        runId, agentId, agentName: agent.name,
        status: "failed", tasksProcessed: 0, costUsd: 0,
        summary: errMsg, error: errMsg,
      };
    }
  }

  // Regular agent: process assigned tasks
  let tasksProcessed = 0;
  let totalCost = 0;
  const summaryParts: string[] = [];

  try {
    const tasks = await getGoalsByAgent(agentId, supabase);
    const activeTasks = tasks
      .filter((t) => t.level === "task" && t.status === "active" && !t.checked_out_by)
      .slice(0, MAX_TASKS_PER_HEARTBEAT);

    for (const task of activeTasks) {
      // Atomic checkout
      const checkout = await checkoutTask(task.id, agentId, supabase);
      if (!checkout.success) continue;

      try {
        // In DEV_BYPASS, simulate task completion
        if (DEV_BYPASS) {
          summaryParts.push(`Completed: ${task.title}`);
          await updateGoalStatus(task.id, "completed", supabase);
          tasksProcessed++;
          continue;
        }

        // Execute via existing agent runtime
        const { executeAgent } = await import("@/lib/agents/runtime");
        const result = await executeAgent(agentId, {
          type: "task",
          source: "heartbeat",
          event_type: "goal_task",
        }, supabase);

        if (result.success) {
          await updateGoalStatus(task.id, "completed", supabase);
          summaryParts.push(`Completed: ${task.title}`);
        } else {
          summaryParts.push(`Failed: ${task.title}`);
        }

        totalCost += (result as any).cost_usd ?? 0;
        tasksProcessed++;
      } finally {
        await releaseTask(task.id, agentId, supabase);
      }
    }

    if (activeTasks.length === 0) {
      summaryParts.push("No tasks assigned");
    }

    const summary = summaryParts.join("; ");

    await supabase
      .from("heartbeat_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        tasks_processed: tasksProcessed,
        cost_usd: totalCost,
        summary,
      })
      .eq("id", runId);

    return {
      runId, agentId, agentName: agent.name,
      status: "completed", tasksProcessed, costUsd: totalCost, summary,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Heartbeat failed";

    await supabase
      .from("heartbeat_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error: errMsg })
      .eq("id", runId);

    return {
      runId, agentId, agentName: agent.name,
      status: "failed", tasksProcessed, costUsd: totalCost,
      summary: errMsg, error: errMsg,
    };
  }
}

// ── Trigger All Heartbeats (CEO first, then workers in parallel) ──

export async function triggerAllHeartbeats(
  businessId: string,
  supabase: any
): Promise<HeartbeatResult[]> {
  const results: HeartbeatResult[] = [];

  // Ensure CEO exists
  const ceo = await ensureCEOAgent(businessId, supabase);

  // Step 1: CEO runs first (decomposes goals, creates tasks)
  const ceoResult = await triggerHeartbeat(businessId, ceo.id, "scheduled", supabase);
  results.push(ceoResult);

  // Step 2: All other active agents run in parallel
  const { data: agents } = await supabase
    .from("agents")
    .select("id")
    .eq("business_id", businessId)
    .neq("id", ceo.id)
    .neq("status", "paused")
    .eq("circuit_open", false);

  if (agents?.length) {
    const workerResults = await Promise.all(
      agents.map((a: { id: string }) =>
        triggerHeartbeat(businessId, a.id, "scheduled", supabase)
      )
    );
    results.push(...workerResults);
  }

  return results;
}

// ── Get Recent Heartbeats ──

export async function getRecentHeartbeats(
  businessId: string,
  agentId?: string,
  limit = 20,
  supabase?: any
): Promise<any[]> {
  let query = supabase
    .from("heartbeat_runs")
    .select("*, agents(name, role)")
    .eq("business_id", businessId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return data ?? [];
}

export type { HeartbeatResult };
