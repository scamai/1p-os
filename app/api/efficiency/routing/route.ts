import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const UpdateRoutingSchema = z.object({
  strategy: z.enum(['quality', 'balanced', 'savings']),
});

const STRATEGY_CONFIG = {
  quality: {
    strategy: 'quality',
    description: 'Use the best model for every task. Highest quality, highest cost.',
    defaultModel: 'claude-opus-4-20250514',
    fallbackModel: 'claude-sonnet-4-20250514',
  },
  balanced: {
    strategy: 'balanced',
    description: 'Use Sonnet for most tasks, Opus for complex reasoning. Good balance of quality and cost.',
    defaultModel: 'claude-sonnet-4-20250514',
    fallbackModel: 'claude-haiku-35-20241022',
  },
  savings: {
    strategy: 'savings',
    description: 'Use Haiku for simple tasks, Sonnet for complex ones. Lowest cost.',
    defaultModel: 'claude-haiku-35-20241022',
    fallbackModel: 'claude-sonnet-4-20250514',
  },
};

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

    const { data: config } = await supabase
      .from('safety_config')
      .select('routing_strategy')
      .eq('business_id', business.id)
      .single();

    const strategy = (config?.routing_strategy as keyof typeof STRATEGY_CONFIG) ?? 'balanced';
    const strategyConfig = STRATEGY_CONFIG[strategy] ?? STRATEGY_CONFIG.balanced;

    return NextResponse.json(
      { routing: strategyConfig },
      { status: 200 }
    );
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

    const { error: updateError } = await supabase
      .from('safety_config')
      .update({ routing_strategy: strategy })
      .eq('business_id', business.id);

    if (updateError) {
      console.error('[efficiency/routing] Failed to update strategy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update routing strategy' },
        { status: 500 }
      );
    }

    const strategyConfig = STRATEGY_CONFIG[strategy];

    return NextResponse.json(
      { routing: strategyConfig },
      { status: 200 }
    );
  } catch (error) {
    console.error('[efficiency/routing] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
