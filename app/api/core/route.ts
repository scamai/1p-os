import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { processCommand, getInsights, getQuickStatus } from '@/lib/core';

const CommandSchema = z.object({
  input: z.string().min(1).max(2000),
});

const InsightsSchema = z.object({
  section: z.string().min(1),
});

/**
 * POST /api/core — Process a natural language command.
 * Algorithm-first: keyword matching → action execution. No AI calls.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CommandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const result = await processCommand(parsed.data.input, supabase, business.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[api/core] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/core — Get proactive insights + quick status.
 * ?section=hq|finance|sales|crm|work|team|all
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionParsed = InsightsSchema.safeParse({ section: searchParams.get('section') ?? 'all' });

    if (!sectionParsed.success) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 },
      );
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const [insights, status] = await Promise.all([
      getInsights(sectionParsed.data.section, supabase, business.id),
      getQuickStatus(supabase, business.id),
    ]);

    return NextResponse.json({ insights, status }, { status: 200 });
  } catch (error) {
    console.error('[api/core] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
