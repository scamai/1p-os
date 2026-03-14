import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UpdateRoutingSchema = z.object({
  strategy: z.enum(['quality', 'balanced', 'savings']),
});

// Cost per task invocation (estimated, in USD)
const MODEL_COSTS = {
  'claude-opus-4-20250514': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'claude-sonnet-4-20250514': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-haiku-35-20241022': { inputPer1k: 0.0008, outputPer1k: 0.004 },
} as const;

// Average tokens per task type
const TASK_PROFILES = {
  'Complex reasoning': { avgInputTokens: 2000, avgOutputTokens: 1500, dailyFrequency: 3 },
  'Document drafting': { avgInputTokens: 1500, avgOutputTokens: 2000, dailyFrequency: 5 },
  'Data analysis': { avgInputTokens: 1800, avgOutputTokens: 1000, dailyFrequency: 4 },
  'Simple Q&A': { avgInputTokens: 500, avgOutputTokens: 300, dailyFrequency: 15 },
  'Email composition': { avgInputTokens: 800, avgOutputTokens: 600, dailyFrequency: 8 },
  'Scheduling & reminders': { avgInputTokens: 300, avgOutputTokens: 200, dailyFrequency: 10 },
  'Status updates': { avgInputTokens: 400, avgOutputTokens: 300, dailyFrequency: 6 },
} as const;

type ModelId = keyof typeof MODEL_COSTS;
type TaskType = keyof typeof TASK_PROFILES;

const TASK_ROUTING: Record<string, Record<TaskType, ModelId>> = {
  quality: {
    'Complex reasoning': 'claude-opus-4-20250514',
    'Document drafting': 'claude-opus-4-20250514',
    'Data analysis': 'claude-opus-4-20250514',
    'Simple Q&A': 'claude-sonnet-4-20250514',
    'Email composition': 'claude-opus-4-20250514',
    'Scheduling & reminders': 'claude-sonnet-4-20250514',
    'Status updates': 'claude-sonnet-4-20250514',
  },
  balanced: {
    'Complex reasoning': 'claude-sonnet-4-20250514',
    'Document drafting': 'claude-sonnet-4-20250514',
    'Data analysis': 'claude-sonnet-4-20250514',
    'Simple Q&A': 'claude-haiku-35-20241022',
    'Email composition': 'claude-sonnet-4-20250514',
    'Scheduling & reminders': 'claude-haiku-35-20241022',
    'Status updates': 'claude-haiku-35-20241022',
  },
  savings: {
    'Complex reasoning': 'claude-sonnet-4-20250514',
    'Document drafting': 'claude-haiku-35-20241022',
    'Data analysis': 'claude-haiku-35-20241022',
    'Simple Q&A': 'claude-haiku-35-20241022',
    'Email composition': 'claude-haiku-35-20241022',
    'Scheduling & reminders': 'claude-haiku-35-20241022',
    'Status updates': 'claude-haiku-35-20241022',
  },
};

const STRATEGY_CONFIG = {
  quality: {
    strategy: 'quality',
    name: 'Maximize Quality',
    description: 'Use the best model for every task. Highest quality, highest cost.',
    defaultModel: 'claude-opus-4-20250514',
    fallbackModel: 'claude-sonnet-4-20250514',
  },
  balanced: {
    strategy: 'balanced',
    name: 'Optimize Cost',
    description: 'Use Sonnet for most tasks, Opus for complex reasoning. Good balance of quality and cost.',
    defaultModel: 'claude-sonnet-4-20250514',
    fallbackModel: 'claude-haiku-35-20241022',
  },
  savings: {
    strategy: 'savings',
    name: 'Maximum Savings',
    description: 'Use Haiku for simple tasks, Sonnet for complex ones. Lowest cost.',
    defaultModel: 'claude-haiku-35-20241022',
    fallbackModel: 'claude-sonnet-4-20250514',
  },
};

const MODEL_DISPLAY_NAMES: Record<ModelId, string> = {
  'claude-opus-4-20250514': 'Claude Opus 4',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-35-20241022': 'Claude Haiku 3.5',
};

function calculateTaskCost(taskType: TaskType, modelId: ModelId): number {
  const profile = TASK_PROFILES[taskType];
  const costs = MODEL_COSTS[modelId];
  const inputCost = (profile.avgInputTokens / 1000) * costs.inputPer1k;
  const outputCost = (profile.avgOutputTokens / 1000) * costs.outputPer1k;
  return inputCost + outputCost;
}

function calculateDailyCost(strategy: string, agentCount: number): number {
  const routing = TASK_ROUTING[strategy];
  if (!routing) return 0;

  let total = 0;
  for (const [taskType, modelId] of Object.entries(routing)) {
    const profile = TASK_PROFILES[taskType as TaskType];
    const costPerTask = calculateTaskCost(taskType as TaskType, modelId);
    total += costPerTask * profile.dailyFrequency;
  }
  // Scale by agent count (each agent does a fraction of total tasks)
  return total * (agentCount / 5);
}

function buildStrategyBreakdown(strategy: string, agentCount: number) {
  const routing = TASK_ROUTING[strategy];
  if (!routing) return [];

  return Object.entries(routing).map(([taskType, modelId]) => {
    const profile = TASK_PROFILES[taskType as TaskType];
    const costPerTask = calculateTaskCost(taskType as TaskType, modelId);
    const dailyCost = costPerTask * profile.dailyFrequency * (agentCount / 5);

    return {
      taskType,
      complexity: ['Complex reasoning', 'Data analysis', 'Document drafting'].includes(taskType)
        ? 'high'
        : ['Email composition', 'Status updates'].includes(taskType)
        ? 'medium'
        : 'low',
      model: MODEL_DISPLAY_NAMES[modelId],
      modelId,
      costPerTask: Number(costPerTask.toFixed(5)),
      dailyFrequency: profile.dailyFrequency,
      estimatedDailyCost: Number(dailyCost.toFixed(4)),
    };
  });
}

function buildComparisonView(agentCount: number) {
  return (['quality', 'balanced', 'savings'] as const).map((strategy) => {
    const daily = calculateDailyCost(strategy, agentCount);
    const config = STRATEGY_CONFIG[strategy];
    return {
      strategy,
      name: config.name,
      estimatedDailyCost: Number(daily.toFixed(2)),
      estimatedMonthlyCost: Number((daily * 30).toFixed(2)),
    };
  });
}

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

    // Get agent count
    const { count: agentCount } = await supabase
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id);

    const agents = agentCount ?? 5;

    const { data: config } = await supabase
      .from('safety_config')
      .select('routing_strategy')
      .eq('business_id', business.id)
      .single();

    const strategy = (config?.routing_strategy as keyof typeof STRATEGY_CONFIG) ?? 'balanced';
    const strategyConfig = STRATEGY_CONFIG[strategy] ?? STRATEGY_CONFIG.balanced;

    return NextResponse.json({
      routing: {
        ...strategyConfig,
        agentCount: agents,
        taskBreakdown: buildStrategyBreakdown(strategy, agents),
        estimatedDailyCost: Number(calculateDailyCost(strategy, agents).toFixed(2)),
        estimatedMonthlyCost: Number((calculateDailyCost(strategy, agents) * 30).toFixed(2)),
      },
      comparison: buildComparisonView(agents),
    }, { status: 200 });
  } catch (error) {
    console.error('[efficiency/routing] Unexpected error:', error);
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
    const parsed = UpdateRoutingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { strategy } = parsed.data;

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

    // Update safety_config with new routing strategy
    const { error: updateError } = await supabase
      .from('safety_config')
      .update({
        routing_strategy: strategy,
        model_routing_strategy: strategy,
      })
      .eq('business_id', business.id);

    if (updateError) {
      console.error('[efficiency/routing] Failed to update strategy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update routing strategy' },
        { status: 500 }
      );
    }

    // Get agent count for cost projections
    const { count: agentCount } = await supabase
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id);

    const agents = agentCount ?? 5;
    const strategyConfig = STRATEGY_CONFIG[strategy];

    return NextResponse.json({
      routing: {
        ...strategyConfig,
        agentCount: agents,
        taskBreakdown: buildStrategyBreakdown(strategy, agents),
        estimatedDailyCost: Number(calculateDailyCost(strategy, agents).toFixed(2)),
        estimatedMonthlyCost: Number((calculateDailyCost(strategy, agents) * 30).toFixed(2)),
      },
      comparison: buildComparisonView(agents),
    }, { status: 200 });
  } catch (error) {
    console.error('[efficiency/routing] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
