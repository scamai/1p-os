import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getCostSnapshot,
  getAgentCosts,
  getProjectedMonthlyCost,
} from '@/lib/efficiency/cost-tracker';

const QuerySchema = z.object({
  period: z.enum(['today', 'this_week', 'this_month']).default('today'),
  view: z
    .enum(['summary', 'by-agent', 'by-model', 'by-task-type'])
    .default('summary'),
});

/** Map query period values to cost-tracker period values */
function toCostTrackerPeriod(
  period: 'today' | 'this_week' | 'this_month'
): 'today' | 'week' | 'month' {
  switch (period) {
    case 'today':
      return 'today';
    case 'this_week':
      return 'week';
    case 'this_month':
      return 'month';
  }
}

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      .select('id, monthly_budget_usd')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const periodStart = getPeriodStart(period);
    const costTrackerPeriod = toCostTrackerPeriod(period);

    // Fetch raw cost records for the period
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

    // Fetch efficiency metrics (tokens saved, deduplication, batching)
    const { data: efficiencyRecords } = await supabase
      .from('efficiency_events')
      .select('event_type, tokens_saved, cost_saved_usd')
      .eq('business_id', business.id)
      .gte('created_at', periodStart);

    const effEvents = efficiencyRecords ?? [];
    const tokensSavedByCache = effEvents
      .filter((e) => e.event_type === 'cache_hit')
      .reduce((sum, e) => sum + (e.tokens_saved ?? 0), 0);
    const tokensSavedByOptimization = effEvents
      .filter((e) => e.event_type === 'prompt_optimization')
      .reduce((sum, e) => sum + (e.tokens_saved ?? 0), 0);
    const tasksDeduplicated = effEvents.filter(
      (e) => e.event_type === 'deduplication'
    ).length;
    const tasksBatched = effEvents.filter(
      (e) => e.event_type === 'batching'
    ).length;
    const costSavedByEfficiency = effEvents.reduce(
      (sum, e) => sum + (e.cost_saved_usd ?? 0),
      0
    );
    const tokensSaved = tokensSavedByCache + tokensSavedByOptimization;

    const efficiencyMetrics = {
      tokensSavedByCache,
      tokensSavedByOptimization,
      tokensSaved,
      tasksDeduplicated,
      tasksBatched,
      costSavedByEfficiency: Math.round(costSavedByEfficiency * 100) / 100,
    };

    // ---------- SUMMARY ----------
    if (view === 'summary') {
      const snapshot = await getCostSnapshot(
        business.id,
        costTrackerPeriod,
        supabase
      );
      const projectedMonthlyCost = await getProjectedMonthlyCost(
        business.id,
        supabase
      );
      const monthlyBudget = business.monthly_budget_usd ?? 0;
      const budgetRemaining = Math.max(
        0,
        monthlyBudget - snapshot.totalCost
      );

      return NextResponse.json(
        {
          period,
          totalCost: Math.round(snapshot.totalCost * 100) / 100,
          tokenCount: snapshot.tokenCount,
          requestCount: snapshot.requestCount,
          budgetRemaining: Math.round(budgetRemaining * 100) / 100,
          monthlyBudget,
          projectedMonthlyCost: Math.round(projectedMonthlyCost * 100) / 100,
          tokensSaved,
          costSavedByEfficiency:
            Math.round(costSavedByEfficiency * 100) / 100,
          efficiency: efficiencyMetrics,
        },
        { status: 200 }
      );
    }

    // ---------- BY-AGENT ----------
    if (view === 'by-agent') {
      const agentCosts = await getAgentCosts(business.id, supabase);

      // Enrich with task counts and hours-saved estimates from records
      const agentTaskCounts: Record<string, number> = {};
      for (const record of records) {
        const agentId = record.agent_id ?? 'unknown';
        agentTaskCounts[agentId] = (agentTaskCounts[agentId] ?? 0) + 1;
      }

      const byAgent = agentCosts
        .map((agent) => {
          const cost =
            period === 'today'
              ? agent.spentToday
              : period === 'this_month'
                ? agent.spentThisMonth
                : agent.totalSpent;
          const tasks = agentTaskCounts[agent.agentId] ?? 0;
          // Rough estimate: each task saves ~5 minutes of human time
          const hoursSaved = Math.round((tasks * 5) / 60 * 100) / 100;
          const efficiencyScore =
            cost > 0 ? Math.round((hoursSaved / cost) * 100) / 100 : 0;

          return {
            agentId: agent.agentId,
            name: agent.agentName,
            role: agent.role,
            cost: Math.round(cost * 100) / 100,
            tasks,
            hoursSaved,
            efficiencyScore,
            dailyBudget: agent.dailyBudget,
            monthlyBudget: agent.monthlyBudget,
          };
        })
        .sort((a, b) => b.cost - a.cost);

      return NextResponse.json(
        { period, byAgent, efficiency: efficiencyMetrics },
        { status: 200 }
      );
    }

    // ---------- BY-MODEL ----------
    if (view === 'by-model') {
      const byModel: Record<
        string,
        { cost: number; tokens: number; calls: number }
      > = {};
      for (const record of records) {
        const model = record.model ?? 'unknown';
        if (!byModel[model]) {
          byModel[model] = { cost: 0, tokens: 0, calls: 0 };
        }
        byModel[model].cost += record.cost ?? 0;
        byModel[model].tokens += record.tokens_used ?? 0;
        byModel[model].calls += 1;
      }

      // Convert to sorted array
      const breakdown = Object.entries(byModel)
        .map(([model, data]) => ({
          model,
          cost: Math.round(data.cost * 100) / 100,
          tokens: data.tokens,
          calls: data.calls,
          avgCostPerCall:
            data.calls > 0
              ? Math.round((data.cost / data.calls) * 10000) / 10000
              : 0,
        }))
        .sort((a, b) => b.cost - a.cost);

      return NextResponse.json(
        { period, byModel: breakdown, efficiency: efficiencyMetrics },
        { status: 200 }
      );
    }

    // ---------- BY-TASK-TYPE ----------
    if (view === 'by-task-type') {
      const byTaskType: Record<
        string,
        { cost: number; tokens: number; count: number }
      > = {};
      for (const record of records) {
        const taskType = record.task_type ?? 'unknown';
        if (!byTaskType[taskType]) {
          byTaskType[taskType] = { cost: 0, tokens: 0, count: 0 };
        }
        byTaskType[taskType].cost += record.cost ?? 0;
        byTaskType[taskType].tokens += record.tokens_used ?? 0;
        byTaskType[taskType].count += 1;
      }

      const breakdown = Object.entries(byTaskType)
        .map(([taskType, data]) => ({
          taskType,
          cost: Math.round(data.cost * 100) / 100,
          tokens: data.tokens,
          count: data.count,
          avgCostPerTask:
            data.count > 0
              ? Math.round((data.cost / data.count) * 10000) / 10000
              : 0,
        }))
        .sort((a, b) => b.cost - a.cost);

      return NextResponse.json(
        { period, byTaskType: breakdown, efficiency: efficiencyMetrics },
        { status: 200 }
      );
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
