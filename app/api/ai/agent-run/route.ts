import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const AgentRunInputSchema = z.object({
  agentId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AgentRunInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId } = parsed.data;

    // Verify agent belongs to user's business
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Dynamic import to avoid circular dependency issues at module load
    const { executeAgent } = await import('@/lib/agents/runtime');
    const result = await executeAgent(agentId, { type: 'manual', source: 'user' }, supabase);

    // Log the run in audit log
    await supabase.from('audit_log').insert({
      business_id: agent.business_id,
      actor: `agent:${agentId}`,
      action: 'agent_run',
      details: {
        agent_name: agent.name,
        success: result.success,
        summary: result.summary,
      },
    });

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('[ai/agent-run] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
