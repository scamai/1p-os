import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UpdateBudgetSchema = z.object({
  global_daily_budget: z.number().nonnegative().optional(),
  global_monthly_budget: z.number().nonnegative().optional(),
  per_agent: z
    .array(
      z.object({
        agent_id: z.string().uuid(),
        daily_limit: z.number().nonnegative().optional(),
        monthly_limit: z.number().nonnegative().optional(),
      })
    )
    .optional(),
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

    // Get global budget config
    const { data: config, error: configError } = await supabase
      .from('safety_config')
      .select('global_daily_budget, global_monthly_budget')
      .eq('business_id', business.id)
      .single();

    if (configError) {
      console.error('[safety/budget] Failed to fetch config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch budget config' },
        { status: 500 }
      );
    }

    // Get per-agent budgets
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, role, budget')
      .eq('business_id', business.id)
      .order('name');

    // Get current period spend
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: dailyRecords } = await supabase
      .from('cost_snapshots')
      .select('cost, agent_id')
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString());

    const { data: monthlyRecords } = await supabase
      .from('cost_snapshots')
      .select('cost, agent_id')
      .eq('business_id', business.id)
      .gte('created_at', monthStart.toISOString());

    const dailySpend = (dailyRecords ?? []).reduce((sum: number, r: { cost: number | null }) => sum + (r.cost ?? 0), 0);
    const monthlySpend = (monthlyRecords ?? []).reduce((sum: number, r: { cost: number | null }) => sum + (r.cost ?? 0), 0);

    // Per-agent spend
    const agentDailySpend: Record<string, number> = {};
    const agentMonthlySpend: Record<string, number> = {};

    for (const record of dailyRecords ?? []) {
      if (record.agent_id) {
        agentDailySpend[record.agent_id] = (agentDailySpend[record.agent_id] ?? 0) + (record.cost ?? 0);
      }
    }
    for (const record of monthlyRecords ?? []) {
      if (record.agent_id) {
        agentMonthlySpend[record.agent_id] = (agentMonthlySpend[record.agent_id] ?? 0) + (record.cost ?? 0);
      }
    }

    return NextResponse.json(
      {
        global: {
          daily_budget: config?.global_daily_budget ?? 50,
          monthly_budget: config?.global_monthly_budget ?? 500,
          daily_spend: Math.round(dailySpend * 100) / 100,
          monthly_spend: Math.round(monthlySpend * 100) / 100,
        },
        agents: (agents ?? []).map((agent: { id: string; name: string; role: string; budget: Record<string, unknown> | null }) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          budget: agent.budget,
          daily_spend: Math.round((agentDailySpend[agent.id] ?? 0) * 100) / 100,
          monthly_spend: Math.round((agentMonthlySpend[agent.id] ?? 0) * 100) / 100,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[safety/budget] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { global_daily_budget, global_monthly_budget, per_agent } = parsed.data;

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

    // Update global budget if provided
    if (global_daily_budget !== undefined || global_monthly_budget !== undefined) {
      const updates: Record<string, number> = {};
      if (global_daily_budget !== undefined) updates.global_daily_budget = global_daily_budget;
      if (global_monthly_budget !== undefined) updates.global_monthly_budget = global_monthly_budget;

      const { error: updateError } = await supabase
        .from('safety_config')
        .update(updates)
        .eq('business_id', business.id);

      if (updateError) {
        console.error('[safety/budget] Failed to update global budget:', updateError);
        return NextResponse.json(
          { error: 'Failed to update global budget' },
          { status: 500 }
        );
      }
    }

    // Update per-agent budgets if provided
    if (per_agent && per_agent.length > 0) {
      for (const agentBudget of per_agent) {
        const budget: Record<string, number | undefined> = {
          daily_limit: agentBudget.daily_limit,
          monthly_limit: agentBudget.monthly_limit,
        };

        const { error: agentError } = await supabase
          .from('agents')
          .update({ budget })
          .eq('id', agentBudget.agent_id)
          .eq('business_id', business.id);

        if (agentError) {
          console.error(`[safety/budget] Failed to update agent ${agentBudget.agent_id}:`, agentError);
        }
      }
    }

    // Audit log
    await supabase.from('audit_log').insert({
      business_id: business.id,
      actor: `user:${user.id}`,
      action: 'budget_updated',
      details: { global_daily_budget, global_monthly_budget, per_agent_count: per_agent?.length ?? 0 },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[safety/budget] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
