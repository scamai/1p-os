import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getLLMRouterStatus,
  routeWithLLMRouter,
  getModelsAsLLMRouterCandidates,
} from '@/lib/efficiency/llm-router';

export const dynamic = 'force-dynamic';

const TestRouteSchema = z.object({
  query: z.string().min(1).max(2000),
  taskType: z.string().optional(),
  agentRole: z.string().optional(),
  strategy: z.enum(['cost-optimized', 'balanced', 'quality-first']).optional(),
});

/**
 * GET /api/efficiency/llm-router
 * Returns LLMRouter status, available models, and health info.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getLLMRouterStatus();
    const candidates = getModelsAsLLMRouterCandidates();

    return NextResponse.json({
      status,
      candidates,
    });
  } catch (error) {
    console.error('[llm-router] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/efficiency/llm-router
 * Test a routing decision for a given query without executing it.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TestRouteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, taskType, agentRole, strategy } = parsed.data;

    const decision = await routeWithLLMRouter({
      query,
      taskType,
      agentRole,
      strategy,
    });

    return NextResponse.json({
      decision: {
        modelId: decision.modelId,
        modelName: decision.modelConfig.displayName,
        provider: decision.modelConfig.provider,
        method: decision.method,
        difficultyScore: decision.difficultyScore,
        confidence: decision.confidence,
        latencyMs: decision.latencyMs,
        reason: decision.reason,
        estimatedCost: {
          per500InputTokens: decision.modelConfig.costPerInputToken * 500,
          per200OutputTokens: decision.modelConfig.costPerOutputToken * 200,
        },
      },
    });
  } catch (error) {
    console.error('[llm-router] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
