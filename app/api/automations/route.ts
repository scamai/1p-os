// =============================================================================
// CRUD API for Automation Jobs, Triggers, and Runs
// GET    /api/automations              — list all jobs + triggers + recent runs
// POST   /api/automations              — create a new job or trigger
// PATCH  /api/automations              — update status (pause/resume/edit)
// DELETE /api/automations              — delete a job or trigger
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { appendLog } from "@/lib/integrations/md-logger";

export const dynamic = 'force-dynamic';

// ─── Validation ──────────────────────────────────────────────────────────────

const CreateJobSchema = z.object({
  type: z.literal("job"),
  name: z.string().min(1).max(200),
  scheduleKind: z.enum(["cron", "interval", "once"]),
  scheduleExpr: z.string().optional(),       // cron expression
  scheduleIntervalMs: z.number().positive().optional(),
  scheduleOnceAt: z.string().optional(),     // ISO timestamp
  scheduleTz: z.string().default("UTC"),
  agentId: z.string().uuid().optional().nullable(),
  payloadMessage: z.string().min(1),
  payloadModel: z.string().optional(),
  deliveryMode: z.enum(["none", "announce", "webhook"]).default("none"),
  deliveryChannel: z.string().optional(),
  deliveryTo: z.string().optional(),
});

const CreateTriggerSchema = z.object({
  type: z.literal("trigger"),
  name: z.string().min(1).max(200),
  event: z.string().min(1),
  condition: z.string().optional(),
  actionAgentId: z.string().uuid().optional().nullable(),
  actionMessage: z.string().min(1),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  itemType: z.enum(["job", "trigger"]),
  status: z.enum(["active", "paused"]).optional(),
  name: z.string().min(1).max(200).optional(),
  // Job-specific updates
  scheduleKind: z.enum(["cron", "interval", "once"]).optional(),
  scheduleExpr: z.string().optional(),
  scheduleIntervalMs: z.number().positive().optional(),
  scheduleOnceAt: z.string().optional(),
  payloadMessage: z.string().optional(),
  // Trigger-specific updates
  event: z.string().optional(),
  condition: z.string().optional(),
  actionMessage: z.string().optional(),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
  itemType: z.enum(["job", "trigger"]),
});

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ jobs: [], triggers: [], runs: [] });
  }

  const { searchParams } = new URL(req.url);
  const runsLimit = parseInt(searchParams.get("runsLimit") ?? "20", 10);

  const [jobsResult, triggersResult, runsResult, agentsResult] = await Promise.all([
    supabase
      .from("automation_jobs")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("automation_triggers")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("automation_runs")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(runsLimit),
    supabase
      .from("agents")
      .select("id, name, role, status")
      .eq("business_id", business.id),
  ]);

  return NextResponse.json({
    jobs: jobsResult.data ?? [],
    triggers: triggersResult.data ?? [],
    runs: runsResult.data ?? [],
    agents: agentsResult.data ?? [],
  });
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "No business" }, { status: 404 });
  }

  const body = await req.json();

  // ── Create Job ──
  if (body.type === "job") {
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const { data: job, error } = await supabase
      .from("automation_jobs")
      .insert({
        business_id: business.id,
        name: d.name,
        schedule_kind: d.scheduleKind,
        schedule_expr: d.scheduleExpr ?? null,
        schedule_interval_ms: d.scheduleIntervalMs ?? null,
        schedule_once_at: d.scheduleOnceAt ?? null,
        schedule_tz: d.scheduleTz,
        agent_id: d.agentId ?? null,
        payload_message: d.payloadMessage,
        payload_model: d.payloadModel ?? null,
        delivery_mode: d.deliveryMode,
        delivery_channel: d.deliveryChannel ?? null,
        delivery_to: d.deliveryTo ?? null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await appendLog({
      action: "automation_create_job",
      actor: user.id,
      details: `Created schedule "${d.name}" (${d.scheduleKind})`,
      metadata: { jobId: job.id, scheduleKind: d.scheduleKind, scheduleExpr: d.scheduleExpr },
    });

    return NextResponse.json({ job });
  }

  // ── Create Trigger ──
  if (body.type === "trigger") {
    const parsed = CreateTriggerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid trigger data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const { data: trigger, error } = await supabase
      .from("automation_triggers")
      .insert({
        business_id: business.id,
        name: d.name,
        event: d.event,
        condition: d.condition ?? null,
        action_agent_id: d.actionAgentId ?? null,
        action_message: d.actionMessage,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await appendLog({
      action: "automation_create_trigger",
      actor: user.id,
      details: `Created trigger "${d.name}" on event "${d.event}"`,
      metadata: { triggerId: trigger.id, event: d.event },
    });

    return NextResponse.json({ trigger });
  }

  return NextResponse.json({ error: "type must be 'job' or 'trigger'" }, { status: 400 });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json({ error: "No business" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const table = d.itemType === "job" ? "automation_jobs" : "automation_triggers";

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (d.status) updates.status = d.status;
  if (d.name) updates.name = d.name;

  if (d.itemType === "job") {
    if (d.scheduleKind) updates.schedule_kind = d.scheduleKind;
    if (d.scheduleExpr !== undefined) updates.schedule_expr = d.scheduleExpr;
    if (d.scheduleIntervalMs !== undefined) updates.schedule_interval_ms = d.scheduleIntervalMs;
    if (d.scheduleOnceAt !== undefined) updates.schedule_once_at = d.scheduleOnceAt;
    if (d.payloadMessage) updates.payload_message = d.payloadMessage;
    // Reset error state when resuming
    if (d.status === "active") {
      updates.consecutive_errors = 0;
    }
  }

  if (d.itemType === "trigger") {
    if (d.event) updates.event = d.event;
    if (d.condition !== undefined) updates.condition = d.condition;
    if (d.actionMessage) updates.action_message = d.actionMessage;
  }

  const { error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", d.id)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  await appendLog({
    action: `automation_update_${d.itemType}`,
    actor: user.id,
    details: `Updated ${d.itemType} ${d.id}: ${d.status ? `status → ${d.status}` : "fields updated"}`,
    metadata: { id: d.id, ...updates },
  });

  return NextResponse.json({ success: true });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
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
    return NextResponse.json({ error: "No business" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid delete" }, { status: 400 });
  }

  const table = parsed.data.itemType === "job" ? "automation_jobs" : "automation_triggers";

  // Get name before deleting for log
  const { data: item } = await supabase
    .from(table)
    .select("name")
    .eq("id", parsed.data.id)
    .eq("business_id", business.id)
    .single();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", parsed.data.id)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  await appendLog({
    action: `automation_delete_${parsed.data.itemType}`,
    actor: user.id,
    details: `Deleted ${parsed.data.itemType} "${item?.name ?? parsed.data.id}"`,
    metadata: { id: parsed.data.id },
  });

  return NextResponse.json({ success: true });
}
