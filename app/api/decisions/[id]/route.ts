import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ResolveDecisionSchema = z.object({
  decision: z.string().min(1),
});

interface RouteContext {
  params: Promise<{ id: string }>;
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
    const parsed = ResolveDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { decision } = parsed.data;

    // Verify ownership and fetch decision
    const { data: existing, error: fetchError } = await supabase
      .from('decision_cards')
      .select('*, businesses!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    if (existing.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Decision already resolved' },
        { status: 409 }
      );
    }

    // Update the decision
    const { data: updated, error: updateError } = await supabase
      .from('decision_cards')
      .update({
        status: 'completed',
        decided_at: new Date().toISOString(),
        decision_payload: { choice: decision },
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[decisions/[id]] Failed to resolve decision:', updateError);
      return NextResponse.json(
        { error: 'Failed to resolve decision' },
        { status: 500 }
      );
    }

    // Log in audit
    await supabase.from('audit_log').insert({
      business_id: existing.business_id,
      actor: `user:${user.id}`,
      action: 'decision_resolved',
      details: {
        decision_id: id,
        decision_type: existing.type,
        choice: decision,
      },
    });

    // Execute resulting action if the decision has one
    if (existing.action_on_resolve) {
      try {
        const { executeAgent } = await import('@/lib/agents/runtime');
        await executeAgent(existing.agent_id, { type: 'decision_resolved', source: 'user', data: { decisionId: id, choice: decision } }, supabase);
      } catch (actionError) {
        console.error('[decisions/[id]] Action execution failed:', actionError);
        // Don't fail the response - the decision was still resolved
      }
    }

    return NextResponse.json({ decision: updated }, { status: 200 });
  } catch (error) {
    console.error('[decisions/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
