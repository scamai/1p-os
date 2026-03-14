import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  system_prompt: z.string().min(1).optional(),
  context_permissions: z.array(z.string()).optional(),
  allowed_actions: z.array(z.string()).optional(),
  triggers: z
    .array(
      z.object({
        type: z.string(),
        config: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
  budget: z
    .object({
      daily_limit: z.number().nonnegative().optional(),
      monthly_limit: z.number().nonnegative().optional(),
      model_preference: z.string().optional(),
    })
    .optional(),
  status: z.enum(['active', 'paused', 'disabled']).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id)')
      .eq('id', id)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch agent stats
    const { count: totalRuns } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('actor', `agent:${id}`)
      .eq('action', 'agent_run');

    const { count: pendingDecisions } = await supabase
      .from('decision_cards')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id)
      .eq('status', 'pending');

    const { businesses: _businesses, ...agentData } = agent;

    return NextResponse.json(
      {
        agent: agentData,
        stats: {
          total_runs: totalRuns ?? 0,
          pending_decisions: pendingDecisions ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[agents/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (existing.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('agents')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[agents/[id]] Failed to update agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent: updated }, { status: 200 });
  } catch (error) {
    console.error('[agents/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (existing.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[agents/[id]] Failed to delete agent:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[agents/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
