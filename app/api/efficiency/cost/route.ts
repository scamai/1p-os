import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const QuerySchema = z.object({
  period: z.enum(['today', 'this_week', 'this_month']).default('today'),
  view: z.enum(['summary', 'by-agent', 'by-model']).default('summary'),
});

function getPeriodStart(period: string): string {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    }
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { period, view } = parsed.data;

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

    const periodStart = getPeriodStart(period);

    const { data: costRecords, error } = await supabase
      .from('cost_records')
      .select('*')
      .eq('business_id', business.id)
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[efficiency/cost] Failed to fetch costs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cost data' },
        { status: 500 }
      );
    }

    const records = costRecords ?? [];

    if (view === 'summary') {
      const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);
      const totalTokens = records.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);

      return NextResponse.json(
        {
          period,
          totalCost,
          totalTokens,
          recordCount: records.length,
        },
        { status: 200 }
      );
    }

    if (view === 'by-agent') {
      const byAgent: Record<string, { cost: number; tokens: number; runs: number }> = {};
      for (const record of records) {
        const agentId = record.agent_id ?? 'unknown';
        if (!byAgent[agentId]) {
          byAgent[agentId] = { cost: 0, tokens: 0, runs: 0 };
        }
        byAgent[agentId].cost += record.cost ?? 0;
        byAgent[agentId].tokens += record.tokens_used ?? 0;
        byAgent[agentId].runs += 1;
      }

      return NextResponse.json({ period, byAgent }, { status: 200 });
    }

    if (view === 'by-model') {
      const byModel: Record<string, { cost: number; tokens: number; calls: number }> = {};
      for (const record of records) {
        const model = record.model ?? 'unknown';
        if (!byModel[model]) {
          byModel[model] = { cost: 0, tokens: 0, calls: 0 };
        }
        byModel[model].cost += record.cost ?? 0;
        byModel[model].tokens += record.tokens_used ?? 0;
        byModel[model].calls += 1;
      }

      return NextResponse.json({ period, byModel }, { status: 200 });
    }

    return NextResponse.json({ period, records }, { status: 200 });
  } catch (error) {
    console.error('[efficiency/cost] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
