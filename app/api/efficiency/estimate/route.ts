import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  estimateTaskCost,
  estimateAgentDailyCost,
  estimateMonthlyTotal,
} from '@/lib/efficiency/price-estimator';
import { MODELS } from '@/lib/efficiency/model-registry';
import type { RoutingStrategy } from '@/lib/efficiency/task-router';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  action: z.enum(['hire_agent', 'run_task', 'add_agents', 'change_strategy']),
  role: z.string().optional(),
  strategy: z
    .enum(['cost-optimized', 'balanced', 'quality-first'])
    .optional(),
  taskType: z.string().optional(),
  count: z.coerce.number().int().min(1).max(50).optional(),
  newStrategy: z
    .enum(['cost-optimized', 'balanced', 'quality-first'])
    .optional(),
});

const STRATEGY_LABELS: Record<string, string> = {
  'cost-optimized': 'Savings',
  balanced: 'Balanced',
  'quality-first': 'Quality',
};

function getConfidence(
  hasHistoricalData: boolean,
  sampleSize: number
): 'high' | 'medium' | 'low' {
  if (hasHistoricalData && sampleSize >= 50) return 'high';
  if (hasHistoricalData && sampleSize >= 10) return 'medium';
  return 'low';
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

    const { action, role, strategy, taskType, count, newStrategy } =
      parsed.data;

    // Get user's business for historical data lookups
    const { data: business } = await supabase
      .from('businesses')
      .select('id, monthly_budget_usd')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Check for historical data to determine confidence
    const { count: historicalCount } = await supabase
      .from('cost_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id);

    const sampleSize = historicalCount ?? 0;
    const hasHistoricalData = sampleSize > 0;

    // ---------- HIRE AGENT ----------
    if (action === 'hire_agent') {
      const roleKey = role ?? 'operations';
      const routingStrategy: RoutingStrategy = strategy ?? 'balanced';

      const dailyCost = estimateAgentDailyCost(roleKey, routingStrategy);
      const monthlyCost = dailyCost * 30;

      // Per-model breakdown: show what cost would be for each model
      const modelBreakdown = Object.entries(MODELS).map(([key, model]) => {
        const dailyForModel = estimateAgentDailyCost(roleKey, routingStrategy);
        // Approximate per-model by ratio
        const defaultModel =
          routingStrategy === 'quality-first'
            ? MODELS['claude-sonnet-4-20250514']
            : MODELS['claude-haiku-3-5'];
        const ratio = defaultModel
          ? (model.costPerInputToken + model.costPerOutputToken) /
            (defaultModel.costPerInputToken + defaultModel.costPerOutputToken)
          : 1;
        return {
          model: model.displayName,
          modelId: key,
          estimatedDailyCost: Math.round(dailyForModel * ratio * 100) / 100,
          estimatedMonthlyCost:
            Math.round(dailyForModel * ratio * 30 * 100) / 100,
        };
      });

      return NextResponse.json(
        {
          action,
          role: roleKey,
          strategy: routingStrategy,
          strategyLabel: STRATEGY_LABELS[routingStrategy],
          confidence: getConfidence(hasHistoricalData, sampleSize),
          estimate: {
            dailyCost: Math.round(dailyCost * 100) / 100,
            monthlyCost: Math.round(monthlyCost * 100) / 100,
          },
          modelBreakdown,
        },
        { status: 200 }
      );
    }

    // ---------- RUN TASK ----------
    if (action === 'run_task') {
      const taskKey = taskType ?? 'chat_response';
      const costPerTask = estimateTaskCost(taskKey);

      // Determine which model would be selected under each strategy
      const strategyResults = (
        ['cost-optimized', 'balanced', 'quality-first'] as RoutingStrategy[]
      ).map((s) => {
        const modelKey =
          s === 'quality-first'
            ? 'claude-sonnet-4-20250514'
            : 'claude-haiku-3-5';
        const model = MODELS[modelKey];
        const cost = model ? estimateTaskCost(taskKey, model) : costPerTask;
        return {
          strategy: s,
          strategyLabel: STRATEGY_LABELS[s],
          model: model?.displayName ?? modelKey,
          estimatedCost: Math.round(cost * 10000) / 10000,
        };
      });

      return NextResponse.json(
        {
          action,
          taskType: taskKey,
          confidence: getConfidence(hasHistoricalData, sampleSize),
          estimatedCost: Math.round(costPerTask * 10000) / 10000,
          selectedModel: 'Claude 3.5 Haiku',
          byStrategy: strategyResults,
        },
        { status: 200 }
      );
    }

    // ---------- ADD AGENTS ----------
    if (action === 'add_agents') {
      const agentCount = count ?? 1;
      const routingStrategy: RoutingStrategy = strategy ?? 'balanced';

      // Get current agent count and monthly spend
      const { data: currentAgents } = await supabase
        .from('agents')
        .select('id, spent_this_month_usd')
        .eq('business_id', business.id);

      const currentCount = currentAgents?.length ?? 0;
      const currentMonthlySpend = (currentAgents ?? []).reduce(
        (sum, a) => sum + (a.spent_this_month_usd ?? 0),
        0
      );

      const additionalMonthlyCost = estimateMonthlyTotal(
        agentCount,
        routingStrategy
      );
      const projectedMonthlyTotal = currentMonthlySpend + additionalMonthlyCost;
      const monthlyBudget = business.monthly_budget_usd ?? 0;

      return NextResponse.json(
        {
          action,
          count: agentCount,
          strategy: routingStrategy,
          strategyLabel: STRATEGY_LABELS[routingStrategy],
          confidence: getConfidence(hasHistoricalData, sampleSize),
          currentAgentCount: currentCount,
          currentMonthlyCost: Math.round(currentMonthlySpend * 100) / 100,
          additionalMonthlyCost:
            Math.round(additionalMonthlyCost * 100) / 100,
          projectedMonthlyTotal:
            Math.round(projectedMonthlyTotal * 100) / 100,
          monthlyBudget,
          overBudget: projectedMonthlyTotal > monthlyBudget,
          difference:
            Math.round(
              (projectedMonthlyTotal - currentMonthlySpend) * 100
            ) / 100,
        },
        { status: 200 }
      );
    }

    // ---------- CHANGE STRATEGY ----------
    if (action === 'change_strategy') {
      const targetStrategy: RoutingStrategy = newStrategy ?? 'balanced';

      // Get current agents to estimate impact
      const { data: currentAgents } = await supabase
        .from('agents')
        .select('id, role, spent_this_month_usd')
        .eq('business_id', business.id);

      const agents = currentAgents ?? [];
      const currentMonthlySpend = agents.reduce(
        (sum, a) => sum + (a.spent_this_month_usd ?? 0),
        0
      );

      // Estimate cost under each strategy for all agents
      const strategies: RoutingStrategy[] = [
        'cost-optimized',
        'balanced',
        'quality-first',
      ];

      const projections = strategies.map((s) => {
        const estimated = agents.reduce((sum, a) => {
          const daily = estimateAgentDailyCost(a.role ?? 'operations', s);
          return sum + daily * 30;
        }, 0);

        return {
          strategy: s,
          strategyLabel: STRATEGY_LABELS[s],
          projectedMonthlyCost: Math.round(estimated * 100) / 100,
          differenceFromCurrent:
            Math.round((estimated - currentMonthlySpend) * 100) / 100,
          percentChange:
            currentMonthlySpend > 0
              ? Math.round(
                  ((estimated - currentMonthlySpend) / currentMonthlySpend) *
                    10000
                ) / 100
              : 0,
        };
      });

      const targetProjection = projections.find(
        (p) => p.strategy === targetStrategy
      );

      return NextResponse.json(
        {
          action,
          newStrategy: targetStrategy,
          newStrategyLabel: STRATEGY_LABELS[targetStrategy],
          confidence: getConfidence(hasHistoricalData, sampleSize),
          currentMonthlyCost: Math.round(currentMonthlySpend * 100) / 100,
          projectedMonthlyCost: targetProjection?.projectedMonthlyCost ?? 0,
          difference: targetProjection?.differenceFromCurrent ?? 0,
          percentChange: targetProjection?.percentChange ?? 0,
          allStrategies: projections,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[efficiency/estimate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
