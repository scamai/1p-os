// =============================================================================
// 1P OS — Gateway API Route
// REST + SSE gateway for real-time agent communication
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { toolRegistry } from '@/lib/gateway/tools';
import { channelManager } from '@/lib/gateway/channels';
import { automationEngine } from '@/lib/gateway/automation';
import type {
  GatewayMethod,
  GatewayResponse,
  SSEEvent,
} from '@/lib/gateway/protocol';
import { encodeSSE } from '@/lib/gateway/protocol';
import type { ToolCategory, ToolContext } from '@/lib/gateway/tools';
import type { AutomationJob } from '@/lib/gateway/automation';

export const dynamic = 'force-dynamic';

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const GatewayRequestSchema = z.object({
  method: z.enum([
    'tools.list',
    'tools.execute',
    'channels.list',
    'channels.send',
    'sessions.list',
    'automations.list',
    'automations.add',
    'agent.run',
  ] as const),
  params: z.record(z.string(), z.unknown()).optional(),
});

const ToolExecuteParamsSchema = z.object({
  name: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
  agentId: z.string().uuid(),
  sessionId: z.string().optional(),
});

const ChannelSendParamsSchema = z.object({
  channelId: z.string(),
  to: z.string(),
  text: z.string(),
});

const AutomationAddParamsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  schedule: z.union([
    z.object({ kind: z.literal('cron'), expr: z.string(), tz: z.string().optional() }),
    z.object({ kind: z.literal('interval'), everyMs: z.number().positive() }),
    z.object({ kind: z.literal('once'), at: z.string() }),
  ]),
  agentId: z.string().uuid(),
  payload: z.object({
    message: z.string(),
    model: z.string().optional(),
  }),
  delivery: z
    .object({
      mode: z.enum(['none', 'announce', 'webhook']),
      channel: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

const AgentRunParamsSchema = z.object({
  agentId: z.string().uuid(),
  message: z.string(),
  model: z.string().optional(),
  sessionId: z.string().optional(),
});

// -----------------------------------------------------------------------------
// GET — SSE Stream for Real-Time Events
// -----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial heartbeat
        const heartbeat: SSEEvent = {
          type: 'heartbeat',
          data: { connected: true, userId: user.id },
          timestamp: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(encodeSSE(heartbeat)));

        // Keep-alive interval (every 30 seconds)
        const keepAlive = setInterval(() => {
          try {
            const ping: SSEEvent = {
              type: 'heartbeat',
              data: { ts: Date.now() },
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(encoder.encode(encodeSSE(ping)));
          } catch {
            clearInterval(keepAlive);
          }
        }, 30_000);

        // Clean up on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch {
            // Stream already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[gateway] SSE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// POST — RPC Method Dispatch
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found for user' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = GatewayRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { method, params } = parsed.data;
    const response = await dispatch(
      method,
      params ?? {},
      business.id,
      user.id
    );

    const status = response.ok ? 200 : 400;
    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('[gateway] POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// Method Dispatcher
// -----------------------------------------------------------------------------

async function dispatch(
  method: GatewayMethod,
  params: Record<string, unknown>,
  businessId: string,
  userId: string
): Promise<GatewayResponse> {
  switch (method) {
    case 'tools.list':
      return handleToolsList(params);

    case 'tools.execute':
      return handleToolsExecute(params, businessId);

    case 'channels.list':
      return handleChannelsList();

    case 'channels.send':
      return handleChannelsSend(params);

    case 'sessions.list':
      return handleSessionsList(businessId);

    case 'automations.list':
      return handleAutomationsList();

    case 'automations.add':
      return handleAutomationsAdd(params);

    case 'agent.run':
      return handleAgentRun(params, businessId);

    default:
      return { ok: false, error: `Unknown method: ${method}` };
  }
}

// -----------------------------------------------------------------------------
// Method Handlers
// -----------------------------------------------------------------------------

async function handleToolsList(
  params: Record<string, unknown>
): Promise<GatewayResponse> {
  const category = params.category as ToolCategory | undefined;
  const tools = toolRegistry.list(category);
  return { ok: true, data: { tools } };
}

async function handleToolsExecute(
  params: Record<string, unknown>,
  businessId: string
): Promise<GatewayResponse> {
  const parsed = ToolExecuteParamsSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid tool execute params' };
  }

  const { name, input, agentId, sessionId } = parsed.data;

  const context: ToolContext = {
    agentId,
    businessId,
    sessionId: sessionId ?? crypto.randomUUID(),
  };

  const result = await toolRegistry.execute(name, input, context);

  if (result.type === 'error') {
    return { ok: false, error: result.content };
  }

  return { ok: true, data: result };
}

async function handleChannelsList(): Promise<GatewayResponse> {
  const channels = channelManager.list();
  return { ok: true, data: { channels } };
}

async function handleChannelsSend(
  params: Record<string, unknown>
): Promise<GatewayResponse> {
  const parsed = ChannelSendParamsSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid channel send params' };
  }

  try {
    const result = await channelManager.sendViaChannel(
      parsed.data.channelId,
      parsed.data.to,
      parsed.data.text
    );
    return { ok: true, data: result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

async function handleSessionsList(
  _businessId: string
): Promise<GatewayResponse> {
  // Placeholder: in production, sessions would be tracked in Redis or DB
  return { ok: true, data: { sessions: [] } };
}

async function handleAutomationsList(): Promise<GatewayResponse> {
  const jobs = automationEngine.listJobs();
  const triggers = automationEngine.listTriggers();
  return { ok: true, data: { jobs, triggers } };
}

async function handleAutomationsAdd(
  params: Record<string, unknown>
): Promise<GatewayResponse> {
  const parsed = AutomationAddParamsSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid automation params' };
  }

  const job: AutomationJob = {
    ...parsed.data,
    status: 'active',
    state: {
      consecutiveErrors: 0,
    },
  };

  try {
    automationEngine.addJob(job);
    return { ok: true, data: { jobId: job.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to add job',
    };
  }
}

async function handleAgentRun(
  params: Record<string, unknown>,
  businessId: string
): Promise<GatewayResponse> {
  const parsed = AgentRunParamsSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid agent run params' };
  }

  // Create a session ID for this run
  const sessionId = crypto.randomUUID();
  const runId = crypto.randomUUID();

  // In production, this would dispatch to the agent runtime
  // and return the session ID for SSE streaming
  return {
    ok: true,
    data: {
      sessionId,
      runId,
      agentId: parsed.data.agentId,
      status: 'started',
      message: parsed.data.message,
    },
  };
}
