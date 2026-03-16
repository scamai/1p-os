/**
 * Agent Collaboration — agents hand off work to each other through a message bus.
 *
 * Handoffs represent structured work transfers between agents:
 * task, data, alert, or request types.
 */

import { DEV_BYPASS, MOCK_AGENTS } from "@/lib/supabase/dev-bypass";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentHandoff {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  type: "task" | "data" | "alert" | "request";
  subject: string;
  payload: Record<string, unknown>;
  status: "pending" | "accepted" | "completed";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock data for DEV_BYPASS
// ---------------------------------------------------------------------------

const now = new Date();
const today = now.toISOString().split("T")[0];

const MOCK_HANDOFFS: AgentHandoff[] = [
  {
    id: "00000000-0000-0000-0000-000000000501",
    fromAgentId: MOCK_AGENTS[2].id, // Sales Agent
    fromAgentName: "Sales Agent",
    toAgentId: MOCK_AGENTS[4].id, // Support Agent (acting as Proposal Writer stand-in)
    toAgentName: "Proposal Writer",
    type: "task",
    subject: "Qualified lead: Globex Corp",
    payload: {
      leadName: "Globex Corp",
      dealValue: 5000,
      notes: "Discovery call completed. Budget confirmed. Decision maker engaged.",
    },
    status: "pending",
    createdAt: `${today}T07:05:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000502",
    fromAgentId: MOCK_AGENTS[4].id, // Support Agent
    fromAgentName: "Support Agent",
    toAgentId: MOCK_AGENTS[5].id, // Content Agent
    toAgentName: "Content Agent",
    type: "data",
    subject: "Top 3 issues this week for FAQ",
    payload: {
      issues: [
        "Login timeout on mobile",
        "CSV export missing headers",
        "Billing page not loading for Safari users",
      ],
    },
    status: "accepted",
    createdAt: `${today}T06:30:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000503",
    fromAgentId: MOCK_AGENTS[3].id, // Finance Agent
    fromAgentName: "Finance Agent",
    toAgentId: MOCK_AGENTS[1].id, // Admin Agent (Ops)
    toAgentName: "Ops Agent",
    type: "alert",
    subject: "Stripe payout discrepancy: $210",
    payload: {
      expected: 1420,
      actual: 1210,
      period: "March 1-12",
      stripePayoutId: "po_1abc",
    },
    status: "pending",
    createdAt: `${today}T06:45:00Z`,
  },
  {
    id: "00000000-0000-0000-0000-000000000504",
    fromAgentId: MOCK_AGENTS[5].id, // Content Agent
    fromAgentName: "Content Agent",
    toAgentId: MOCK_AGENTS[1].id, // Admin Agent (Ops)
    toAgentName: "Ops Agent",
    type: "request",
    subject: "Blog post ready for scheduling",
    payload: {
      title: "5 Ways AI Agents Save Solo Founders 20 Hours/Week",
      wordCount: 1200,
      status: "draft_complete",
    },
    status: "completed",
    createdAt: `${today}T05:15:00Z`,
  },
];

export { MOCK_HANDOFFS };

// ---------------------------------------------------------------------------
// Supabase client type (minimal interface to avoid hard dependency)
// ---------------------------------------------------------------------------

interface SupabaseClient {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => {
      select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> };
    };
    select: () => {
      eq: (col: string, val: string) => {
        in: (col: string, vals: string[]) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
        };
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
    };
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Create a handoff record in the agent_messages table.
 * In DEV_BYPASS mode, returns a mock handoff.
 */
export async function createHandoff(
  fromAgentId: string,
  toAgentId: string,
  type: AgentHandoff["type"],
  subject: string,
  payload: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<AgentHandoff> {
  if (DEV_BYPASS) {
    const handoff: AgentHandoff = {
      id: crypto.randomUUID(),
      fromAgentId,
      fromAgentName: MOCK_AGENTS.find((a) => a.id === fromAgentId)?.name ?? "Unknown",
      toAgentId,
      toAgentName: MOCK_AGENTS.find((a) => a.id === toAgentId)?.name ?? "Unknown",
      type,
      subject,
      payload,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return handoff;
  }

  const row = {
    from_agent_id: fromAgentId,
    to_agent_id: toAgentId,
    type,
    subject,
    payload,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("agent_messages")
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create handoff: ${String(error)}`);
  }

  return {
    id: data.id as string,
    fromAgentId: data.from_agent_id as string,
    fromAgentName: data.from_agent_name as string,
    toAgentId: data.to_agent_id as string,
    toAgentName: data.to_agent_name as string,
    type: data.type as AgentHandoff["type"],
    subject: data.subject as string,
    payload: data.payload as Record<string, unknown>,
    status: data.status as AgentHandoff["status"],
    createdAt: data.created_at as string,
  };
}

/**
 * Get all pending/accepted handoffs for a business.
 * In DEV_BYPASS mode, returns mock handoffs.
 */
export async function getActiveHandoffs(
  businessId: string,
  supabase: SupabaseClient,
): Promise<AgentHandoff[]> {
  if (DEV_BYPASS) {
    return MOCK_HANDOFFS.filter((h) => h.status !== "completed");
  }

  const { data, error } = await supabase
    .from("agent_messages")
    .select()
    .eq("business_id", businessId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    fromAgentId: row.from_agent_id as string,
    fromAgentName: row.from_agent_name as string,
    toAgentId: row.to_agent_id as string,
    toAgentName: row.to_agent_name as string,
    type: row.type as AgentHandoff["type"],
    subject: row.subject as string,
    payload: row.payload as Record<string, unknown>,
    status: row.status as AgentHandoff["status"],
    createdAt: row.created_at as string,
  }));
}

/**
 * Mark a handoff as completed with an optional result.
 * In DEV_BYPASS mode, returns the updated handoff.
 */
export async function completeHandoff(
  handoffId: string,
  result: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<AgentHandoff> {
  if (DEV_BYPASS) {
    const handoff = MOCK_HANDOFFS.find((h) => h.id === handoffId);
    if (!handoff) {
      throw new Error(`Handoff ${handoffId} not found`);
    }
    return { ...handoff, status: "completed", payload: { ...handoff.payload, result } };
  }

  const { data, error } = await supabase
    .from("agent_messages")
    .update({ status: "completed", result, completed_at: new Date().toISOString() })
    .eq("id", handoffId);

  if (error) {
    throw new Error(`Failed to complete handoff: ${String(error)}`);
  }

  const row = data as unknown as Record<string, unknown>;
  return {
    id: row.id as string,
    fromAgentId: row.from_agent_id as string,
    fromAgentName: row.from_agent_name as string,
    toAgentId: row.to_agent_id as string,
    toAgentName: row.to_agent_name as string,
    type: row.type as AgentHandoff["type"],
    subject: row.subject as string,
    payload: row.payload as Record<string, unknown>,
    status: "completed",
    createdAt: row.created_at as string,
  };
}
