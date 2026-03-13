import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const QuerySchema = z.object({
  action: z.enum(['hire_agent', 'run_task']),
  role: z.string().optional(),
  taskType: z.string().optional(),
  model: z.string().default('claude-sonnet-4-20250514'),
});

// Pricing estimates per 1M tokens (approximate)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-35-20241022': { input: 0.8, output: 4.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
};

// Average token usage estimates by role/task
const ROLE_ESTIMATES: Record<string, { avgInputTokens: number; avgOutputTokens: number; runsPerDay: number }> = {
  operations: { avgInputTokens: 2000, avgOutputTokens: 800, runsPerDay: 5 },
  finance: { avgInputTokens: 1500, avgOutputTokens: 600, runsPerDay: 3 },
  sales: { avgInputTokens: 2500, avgOutputTokens: 1000, runsPerDay: 8 },
  marketing: { avgInputTokens: 3000, avgOutputTokens: 1200, runsPerDay: 4 },
  legal: { avgInputTokens: 4000, avgOutputTokens: 1500, runsPerDay: 2 },
  product: { avgInputTokens: 2000, avgOutputTokens: 800, runsPerDay: 4 },
  'customer-success': { avgInputTokens: 1800, avgOutputTokens: 700, runsPerDay: 10 },
};

const TASK_ESTIMATES: Record<string, { avgInputTokens: number; avgOutputTokens: number }> = {
  chat: { avgInputTokens: 1500, avgOutputTokens: 500 },
  analysis: { avgInputTokens: 3000, avgOutputTokens: 1500 },
  generation: { avgInputTokens: 2000, avgOutputTokens: 2000 },
  review: { avgInputTokens: 4000, avgOutputTokens: 1000 },
};

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

    const { action, role, taskType, model } = parsed.data;
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['claude-sonnet-4-20250514'];

    if (action === 'hire_agent') {
      const roleKey = role ?? 'operations';
      const estimate = ROLE_ESTIMATES[roleKey] ?? ROLE_ESTIMATES['operations'];

      const costPerRun =
        (estimate.avgInputTokens / 1_000_000) * pricing.input +
        (estimate.avgOutputTokens / 1_000_000) * pricing.output;

      const dailyCost = costPerRun * estimate.runsPerDay;
      const monthlyCost = dailyCost * 30;

      return NextResponse.json(
        {
          action,
          role: roleKey,
          model,
          estimate: {
            costPerRun: Math.round(costPerRun * 10000) / 10000,
            dailyCost: Math.round(dailyCost * 100) / 100,
            monthlyCost: Math.round(monthlyCost * 100) / 100,
            avgRunsPerDay: estimate.runsPerDay,
            avgInputTokens: estimate.avgInputTokens,
            avgOutputTokens: estimate.avgOutputTokens,
          },
        },
        { status: 200 }
      );
    }

    if (action === 'run_task') {
      const taskKey = taskType ?? 'chat';
      const estimate = TASK_ESTIMATES[taskKey] ?? TASK_ESTIMATES['chat'];

      const costPerRun =
        (estimate.avgInputTokens / 1_000_000) * pricing.input +
        (estimate.avgOutputTokens / 1_000_000) * pricing.output;

      return NextResponse.json(
        {
          action,
          taskType: taskKey,
          model,
          estimate: {
            costPerRun: Math.round(costPerRun * 10000) / 10000,
            avgInputTokens: estimate.avgInputTokens,
            avgOutputTokens: estimate.avgOutputTokens,
          },
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
