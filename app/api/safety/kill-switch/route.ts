import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ActivateKillSwitchSchema = z.object({
  level: z.number().int().min(1).max(3),
  agentId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
        { error: 'No business found' },
        { status: 404 }
      );
    }

    const { data: config, error } = await supabase
      .from('safety_config')
      .select('kill_switch_active, kill_switch_level, kill_switch_agent_id, kill_switch_activated_at')
      .eq('business_id', business.id)
      .single();

    if (error) {
      console.error('[safety/kill-switch] Failed to fetch status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch kill switch status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ killSwitch: config }, { status: 200 });
  } catch (error) {
    console.error('[safety/kill-switch] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ActivateKillSwitchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { level, agentId } = parsed.data;

    // Level 1 requires an agentId
    if (level === 1 && !agentId) {
      return NextResponse.json(
        { error: 'Level 1 kill switch requires an agentId' },
        { status: 400 }
      );
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      );
    }

    // Update safety config
    const { error: updateError } = await supabase
      .from('safety_config')
      .update({
        kill_switch_active: true,
        kill_switch_level: level,
        kill_switch_agent_id: agentId ?? null,
        kill_switch_activated_at: new Date().toISOString(),
      })
      .eq('business_id', business.id);

    if (updateError) {
      console.error('[safety/kill-switch] Failed to activate:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate kill switch' },
        { status: 500 }
      );
    }

    // Level 1: Pause specific agent
    if (level === 1 && agentId) {
      await supabase
        .from('agents')
        .update({ status: 'paused' })
        .eq('id', agentId)
        .eq('business_id', business.id);
    }

    // Level 2: Pause all agents
    if (level === 2) {
      await supabase
        .from('agents')
        .update({ status: 'paused' })
        .eq('business_id', business.id);
    }

    // Level 3: Disable all agents (hard stop)
    if (level === 3) {
      await supabase
        .from('agents')
        .update({ status: 'disabled' })
        .eq('business_id', business.id);
    }

    // Audit log
    await supabase.from('audit_log').insert({
      business_id: business.id,
      actor: `user:${user.id}`,
      action: 'kill_switch_activated',
      details: { level, agentId: agentId ?? null },
    });

    return NextResponse.json(
      { success: true, level, agentId: agentId ?? null },
      { status: 200 }
    );
  } catch (error) {
    console.error('[safety/kill-switch] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
        { error: 'No business found' },
        { status: 404 }
      );
    }

    // Deactivate kill switch
    const { error: updateError } = await supabase
      .from('safety_config')
      .update({
        kill_switch_active: false,
        kill_switch_level: 0,
        kill_switch_agent_id: null,
        kill_switch_activated_at: null,
      })
      .eq('business_id', business.id);

    if (updateError) {
      console.error('[safety/kill-switch] Failed to deactivate:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate kill switch' },
        { status: 500 }
      );
    }

    // Re-activate all agents
    await supabase
      .from('agents')
      .update({ status: 'active' })
      .eq('business_id', business.id)
      .in('status', ['paused', 'disabled']);

    // Audit log
    await supabase.from('audit_log').insert({
      business_id: business.id,
      actor: `user:${user.id}`,
      action: 'kill_switch_deactivated',
      details: {},
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[safety/kill-switch] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
