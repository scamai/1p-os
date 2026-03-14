import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  system_prompt: z.string().min(1),
  context_permissions: z.array(z.string()),
  allowed_actions: z.array(z.string()),
  triggers: z.array(
    z.object({
      type: z.string(),
      config: z.record(z.string(), z.unknown()),
    })
  ),
  budget: z.object({
    daily_limit: z.number().nonnegative().optional(),
    monthly_limit: z.number().nonnegative().optional(),
    model_preference: z.string().optional(),
  }),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*, businesses!inner(user_id)')
      .eq('businesses.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[agents] Failed to list agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Strip join metadata before returning
    const cleaned = agents.map(({ businesses: _businesses, ...agent }: { businesses: unknown; [key: string]: unknown }) => agent);

    return NextResponse.json({ agents: cleaned }, { status: 200 });
  } catch (error) {
    console.error('[agents] Unexpected error:', error);
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
    const parsed = CreateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'No business found. Complete setup first.' },
        { status: 404 }
      );
    }

    const { data: agent, error: createError } = await supabase
      .from('agents')
      .insert({
        business_id: business.id,
        name: parsed.data.name,
        role: parsed.data.role,
        description: parsed.data.description ?? null,
        system_prompt: parsed.data.system_prompt,
        context_permissions: parsed.data.context_permissions,
        allowed_actions: parsed.data.allowed_actions,
        triggers: parsed.data.triggers,
        budget: parsed.data.budget,
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('[agents] Failed to create agent:', createError);
      return NextResponse.json(
        { error: 'Failed to create agent', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('[agents] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
