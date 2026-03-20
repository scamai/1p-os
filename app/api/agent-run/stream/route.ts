/**
 * Streaming Agent Run Endpoint — SSE stream of AgentRunEvents.
 *
 * POST /api/agent-run/stream
 * Body: { agentId, message, sessionId?, model? }
 *
 * Returns: text/event-stream with AgentRunEvent payloads.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { agentRunner } from "@/lib/agents/runner";
import { sessionManager } from "@/lib/agents/sessions";
import type { AgentRunEvent } from "@/lib/agents/runner";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const StreamRunInputSchema = z.object({
  agentId: z.string().uuid(),
  message: z.string().min(1).max(32_000),
  sessionId: z.string().uuid().optional(),
  model: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse & validate body ──────────────────────────────────────────────

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = StreamRunInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        details: parsed.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { agentId, message, sessionId: requestedSessionId, model } =
    parsed.data;

  // ── Verify agent belongs to user's business ────────────────────────────

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*, businesses!inner(user_id, id)")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (agent.businesses?.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Resolve or create session ──────────────────────────────────────────

  let sessionId: string;
  if (requestedSessionId) {
    const existing = sessionManager.get(requestedSessionId);
    if (existing) {
      sessionId = requestedSessionId;
    } else {
      // Create a new session if the requested one doesn't exist
      const newSession = sessionManager.create(agentId, "web", user.id);
      sessionId = newSession.id;
    }
  } else {
    const newSession = sessionManager.create(agentId, "web", user.id);
    sessionId = newSession.id;
  }

  // ── SSE Stream ─────────────────────────────────────────────────────────

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function sendEvent(event: AgentRunEvent): void {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream may have been closed by the client
        }
      }

      // Send the session ID as the first event so the client knows it
      const initPayload = `event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`;
      controller.enqueue(encoder.encode(initPayload));

      // Run the agent with event streaming
      agentRunner
        .run({
          agentId,
          businessId: agent.business_id,
          sessionId,
          message,
          model,
          channel: "web",
          onEvent: sendEvent,
        })
        .then(async (result) => {
          // Log to audit_log
          try {
            await supabase.from("audit_log").insert({
              business_id: agent.business_id,
              actor: `agent:${agentId}`,
              action: "agent_run_stream",
              details: {
                agent_name: agent.name,
                session_id: sessionId,
                model: result.model,
                cost_usd: result.costUsd,
                input_tokens: result.usage.input,
                output_tokens: result.usage.output,
                tool_calls: result.toolCalls.length,
                duration_ms: result.durationMs,
              },
            });
          } catch {
            // Audit logging failure should not break the stream
          }

          controller.close();
        })
        .catch((err) => {
          console.error('[agent-run/stream] Runner error:', err);
          const errorPayload = `event: error\ndata: ${JSON.stringify({
            message: "Internal server error",
          })}\n\n`;
          try {
            controller.enqueue(encoder.encode(errorPayload));
          } catch {
            // Stream already closed
          }
          controller.close();
        });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
